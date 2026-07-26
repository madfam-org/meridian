/**
 * Canada — the ordinary work route, the three CUSMA business categories that
 * `ca.ts` does not cover, and the study route through to permanent residence.
 *
 * Six pathways:
 *
 * - the employer-specific work permit that rests on a labour market impact
 *   assessment, which is the route the CUSMA permits exist to bypass;
 * - CUSMA traders, CUSMA investors and CUSMA intra-company transferees, the
 *   three categories of Annex 16-A that sit alongside the professionals already
 *   encoded in `ca.ts`;
 * - the study permit, and the post-graduation work permit it leads to. Those two
 *   plus `ca-express-entry-cec` are the chain most people actually walk, so
 *   `leadsTo` is wired study permit → post-graduation work permit → Canadian
 *   Experience Class.
 *
 * Everything here is `reviewStatus: 'unreviewed'`, and in Canada that word does
 * real work. Section 91 of the Immigration and Refugee Protection Act makes it
 * an offence to advise a person for consideration on an application under the
 * Act unless you are a lawyer, a Quebec notary, or a licensee of the College of
 * Immigration and Citizenship Consultants. These records restate published
 * sources and measure recorded facts against them. They are not advice and
 * nobody here is licensed to give it.
 *
 * ## What is asserted here, and what is deliberately not
 *
 * Every citation below was read on 2026-07-25 against the Justice Laws Website
 * (the Act and the Regulations, current to 2026-06-14 for the Regulations and
 * 2026-03-26 for the Act), the Government of Canada's published text of CUSMA
 * Chapter 16, or the Canada Gazette.
 *
 * A great deal of Canadian temporary-residence practice lives in Immigration,
 * Refugees and Citizenship Canada's program delivery instructions, which are
 * published on the department's own website and revised without any legislative
 * step. Those pages could not be retrieved when this file was written. Rather
 * than restate remembered figures, this file states the statutory and
 * regulatory frame — which is stable, citable and was actually read — and routes
 * the operational criteria to a person through `requiresHumanReview`. That is
 * why several criteria here escalate instead of answering: the honest output of
 * a rule the engine cannot source is "a person must check this", not a verdict.
 *
 * The post-graduation work permit is the clearest case. Its criteria are
 * designated by the Minister under s. 205(c)(ii) of the Regulations rather than
 * fixed by regulation, they have been changed more than once, and a superseded
 * eligibility rule presented as current would be worse than no rule at all.
 *
 * ## Out of scope
 *
 * Asylum, refugee protection and humanitarian and compassionate claims are not
 * modelled anywhere in this catalog, by decision rather than by omission. They
 * turn on an assessment of a person's credibility and risk rather than on
 * criteria a form can collect, and a self-serve eligibility checker is the wrong
 * instrument for them. Anyone in that situation needs a lawyer or an accredited
 * representative, not this engine.
 */

import { countryCode, CUSMA_PARTIES, isoDate, type CountryCode } from '@meridian/core';
import type { Pathway } from '../schema.js';

const CA: CountryCode = countryCode('CA');

/** Single verification date for this file. Every citation below was last read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

const IRPR_URL = 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2002-227/';
const IRPA_S30_URL = 'https://laws-lois.justice.gc.ca/eng/acts/I-2.5/section-30.html';
const IRPA_S22_URL = 'https://laws-lois.justice.gc.ca/eng/acts/I-2.5/section-22.html';
const CUSMA_CH16_URL =
  'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/text-texte/16.aspx?lang=eng';
const STUDY_PERMIT_MI_2026_URL = 'https://gazette.gc.ca/rp-pr/p1/2025/2025-12-20/html/notice-avis-eng.html';

/**
 * Citizens of the CUSMA parties other than Canada.
 *
 * Derived from `@meridian/core` rather than written out, so a change to the
 * treaty's membership there flows through to these rules. Canada is excluded
 * because a Canadian citizen needs no Canadian work permit.
 */
const NON_CANADIAN_CUSMA_PARTIES: readonly CountryCode[] = CUSMA_PARTIES.filter((c) => c !== CA);

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------

const irpaS30 = {
  id: 'ca-irpa-s-30',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 30(1)',
  url: IRPA_S30_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A foreign national may not work or study in Canada unless authorised to do so under the Act. Every permit ' +
    'in this file is an authorisation under that section; working or studying outside one is unauthorised, and ' +
    'unauthorised work carries consequences of its own under ss. 200(3)(e) and 221 of the Regulations.',
};

const irpaS22DualIntent = {
  id: 'ca-irpa-s-22-2',
  kind: 'statute' as const,
  instrument: 'Immigration and Refugee Protection Act, S.C. 2001, c. 27',
  provision: 's. 22(2)',
  url: IRPA_S22_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Dual intent. An intention to become a permanent resident does not preclude a person from becoming a ' +
    'temporary resident if the officer is satisfied that they will leave Canada by the end of the period ' +
    'authorised for their stay. Whether the officer is so satisfied is the officer’s judgement, not a test this ' +
    'engine applies.',
};

const irprS200 = {
  id: 'ca-irpr-s-200',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 200',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Issuance of work permits. Under s. 200(1)(b) the applicant must be established to leave Canada by the end of ' +
    'the authorised period. Section 200(1)(c) sets out the routes: (ii) work described in s. 204 or 205 without an ' +
    'offer of employment, (ii.1) the same work with an offer the officer finds genuine under s. 200(5), and ' +
    '(iii) an offer of employment on which an officer has made a positive determination under ss. 203(1)(a) to (g). ' +
    'Section 200(3) lists mandatory refusals, including reasonable grounds to believe the applicant cannot perform ' +
    'the work sought, prior unauthorised work or study in Canada, and — for (ii.1) applicants — the employer not ' +
    'having paid the s. 303.1 fee or provided the s. 209.11 information before the application was made.',
};

const irprS203 = {
  id: 'ca-irpr-s-203',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 203',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Assessment of the employment offered — the provision behind what is commonly called the LMIA. An officer must ' +
    'determine, on the basis of an assessment provided by the Department of Employment and Social Development, ' +
    'whether the offer is genuine and whether the employment is likely to have a neutral or positive effect on the ' +
    'labour market in Canada. Section 203(1.1)(a) provides that the effect is not neutral or positive where the ' +
    'wages set out in the offer are not consistent with the prevailing wage rate for the occupation. Section ' +
    '203(3) lists the factors the assessment must weigh, including job creation or retention, skills transfer, ' +
    'labour shortage, Canadian workplace standards and the employer’s recruitment efforts. Section 203(1)(e) ' +
    'requires that the employer has not charged or recovered the s. 315.2 fee or recruitment fees from the worker.',
};

const irprS315_2 = {
  id: 'ca-irpr-s-315-2',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 315.2',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A fee of CAD 1,000 is payable for each offer of employment for which an employer requests an assessment under ' +
    's. 203(2), payable when the request is made. No fee is payable for work under an international agreement on ' +
    'seasonal agricultural workers, for other primary-agriculture work, or for certain in-home care arrangements ' +
    'described in ss. 315.2(6) and (7). The fee is the employer’s: s. 203(1)(e) makes charging or recovering it ' +
    'from the worker a ground on which the assessment fails.',
};

const irprS204 = {
  id: 'ca-irpr-s-204',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 204(a)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A work permit may be issued without a labour market impact assessment where the work is performed under an ' +
    'international agreement between Canada and one or more countries. CUSMA is such an agreement.',
};

const irprEmployerCompliance = {
  id: 'ca-irpr-employer-compliance',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 209.11(1), 303.1(1) and (2), 200(3)(f.1)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Where an applicant relies on an offer of employment for work described in s. 204 or 205 — the s. 200(1)(c)(ii.1) ' +
    'route, which is how a CUSMA worker with a Canadian employer applies — the employer must, before the applicant ' +
    'applies, submit the offer of employment and the prescribed information through the Minister’s electronic ' +
    'system and pay a fee of CAD 230. Section 200(3)(f.1) makes an officer refuse the permit where either step is ' +
    'missing. The employer must also attest that it has not charged or recovered that fee or any recruitment fees ' +
    'from the worker. Where there is no offer of employment the applicant is on the s. 200(1)(c)(ii) route instead ' +
    'and these employer steps do not arise.',
};

const cusmaDefinitions = {
  id: 'ca-cusma-art-16-1-definitions',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'arts. 16.1 and 16.2',
  url: CUSMA_CH16_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A business person is a citizen of a Party who is engaged in trade in goods, the supply of services or the ' +
    'conduct of investment activities. Temporary entry means entry by a business person of another Party without ' +
    'the intent to establish permanent residence. Article 16.2(2) puts measures regarding citizenship, residence ' +
    'or permanent employment outside the Chapter altogether.',
};

const cusmaJointReview = {
  id: 'ca-cusma-joint-review',
  kind: 'official_guidance' as const,
  instrument: 'Government of Canada — Joint Review of the Canada-United States-Mexico Agreement (CUSMA)',
  url: 'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/joint-review-examen-conjoint.aspx?lang=eng',
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'DEPARTMENTAL PAGE, NOT THE TREATY. It records that the first Joint Review had to take place on the sixth ' +
    'anniversary of the Agreement’s entry into force, 1 July 2026, and that CUSMA remains in force until 2036 ' +
    'whatever the Review decides about extending its term. As read on 25 July 2026 the page had last been updated ' +
    'on 29 June 2026 and did not report the outcome of the Review; this catalog therefore does not state one. ' +
    'That the Agreement remains in force is the material point for anyone relying on Chapter 16 today.',
};

const cusmaCitizenshipOnly = {
  id: 'ca-cusma-citizenship-requirement',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A (application to citizens of the Parties)',
  url: CUSMA_CH16_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Chapter 16 benefits attach to citizens of the Parties. Permanent residents of the United States or Mexico who ' +
    'are not citizens do not come within it, however long they have lived there.',
};

const cusmaSectionB = {
  id: 'ca-cusma-annex-16a-section-b',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A, Section B (Traders and Investors)',
  url: CUSMA_CH16_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Each Party grants temporary entry to a business person seeking to (a) carry on substantial trade in goods or ' +
    'services principally between the territory of the Party of which the business person is a citizen and the ' +
    'territory of the Party into which entry is sought, or (b) establish, develop, administer or provide advice or ' +
    'key technical services to the operation of an investment to which the business person or the business ' +
    'person’s enterprise has committed, or is in the process of committing, a substantial amount of capital, in a ' +
    'capacity that is supervisory, executive or involves essential skills. No labour certification test may be ' +
    'required and no numerical restriction imposed; a visa may still be required. The Section fixes no monetary ' +
    'threshold and no trade percentage, and this catalog does not supply one.',
};

const cusmaSectionC = {
  id: 'ca-cusma-annex-16a-section-c',
  kind: 'treaty' as const,
  instrument: 'Canada-United States-Mexico Agreement, Chapter 16 (Temporary Entry for Business Persons)',
  provision: 'Annex 16-A, Section C (Intra-Company Transferees)',
  url: CUSMA_CH16_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Each Party grants temporary entry to a business person employed by an enterprise who seeks to render services ' +
    'to that enterprise or a subsidiary or affiliate of it, in a capacity that is managerial, executive or ' +
    'involves specialized knowledge. The Section then provides that a Party MAY require the business person to ' +
    'have been employed continuously by the enterprise for one year within the three-year period immediately ' +
    'preceding the date of the application for admission. That is an option the treaty gives Canada, not a ' +
    'requirement the treaty itself imposes; whether and how Canada exercises it appears in Canada’s own measures, ' +
    'which this catalog does not restate.',
};

const irprS205 = {
  id: 'ca-irpr-s-205',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 205(c)(ii)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A work permit may be issued for work that is designated by the Minister as work that can be performed by a ' +
    'foreign national on the basis that limited access to the Canadian labour market is necessary for reasons of ' +
    'public policy relating to the competitiveness of Canada’s academic institutions or economy. This is the ' +
    'regulatory hook the post-graduation work permit hangs on. The Regulations set out the head of power; the ' +
    'criteria are the Minister’s designation, made and changed outside the regulatory process.',
};

const irprS211_1 = {
  id: 'ca-irpr-s-211-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 211.1',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Definition of designated learning institution. A post-secondary institution is designated by the province ' +
    'where the province has an agreement or arrangement with the Minister, on the basis that the institution meets ' +
    'provincial requirements for the delivery of education. Quebec has a further enumerated list. Designation is ' +
    'therefore provincial and can be withdrawn: s. 220.1(2) exists precisely because institutions lose it.',
};

const irprS216 = {
  id: 'ca-irpr-s-216',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 216',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Issuance of study permits. The applicant must have applied in accordance with Part 12, must be established to ' +
    'leave Canada by the end of the authorised period, must meet the other requirements of the Part and any ' +
    'medical requirement, and must have been accepted at a designated learning institution — with, for a ' +
    'post-secondary institution, that institution’s own confirmation of the acceptance sent to the Minister under ' +
    's. 222.1(1)(a). Section 216(3) separately bars a permit for study in Quebec where Quebec law requires a ' +
    'Certificat d’acceptation du Québec and the applicant does not hold one.',
};

const irprS219 = {
  id: 'ca-irpr-s-219',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 219 and 222.1(1)(a)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Confirmation of acceptance. For a post-secondary designated learning institution the institution itself must ' +
    'confirm to the Minister, through the electronic means the Minister specifies and within ten days of being ' +
    'asked, that it has accepted the applicant to the programme named in the application. For any other ' +
    'institution the applicant supplies written documentation of acceptance. An acceptance letter the institution ' +
    'will not confirm is therefore not sufficient.',
};

const irprS220 = {
  id: 'ca-irpr-s-220',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 220',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'An officer shall not issue a study permit unless the applicant has sufficient and available financial ' +
    'resources, without working in Canada, to pay tuition, to maintain themself and any accompanying family ' +
    'members during the proposed period of study, and to pay the cost of transport to and from Canada. The ' +
    'Regulations state the test in those words and set no figure. The figure applied in practice is set by the ' +
    'department, is revised, and is not asserted anywhere in this catalog.',
};

const irprStudyConditions = {
  id: 'ca-irpr-study-permit-conditions',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 'ss. 220.1(1) and 222(1)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'A study permit holder in Canada must enrol at the designated learning institution named in the permit, remain ' +
    'enrolled there until they complete their studies, and actively pursue their course or programme. The permit ' +
    'becomes invalid on the earliest of: 90 days after the holder completes their studies, the day they are no ' +
    'longer enrolled for any other reason, cancellation, or expiry. The 90-day figure is in the Regulations; the ' +
    'window for applying for a post-graduation work permit is not, and is set by the Minister.',
};

const irprS87_1 = {
  id: 'ca-irpr-s-87-1',
  kind: 'regulation' as const,
  instrument: 'Immigration and Refugee Protection Regulations, SOR/2002-227',
  provision: 's. 87.1 (Canadian Experience Class)',
  url: IRPR_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  note:
    'Section 87.1(3) governs which Canadian work counts toward the class, and it excludes more than people expect: ' +
    'no period of employment during which the applicant was engaged in full-time study counts, no period of ' +
    'self-employment or unauthorised work counts, and the applicant must have held temporary resident status ' +
    'throughout. That is why on-campus and off-campus work during a degree does not build the year the class ' +
    'requires, and why the route to permanent residence for a graduate runs through a post-graduation work permit ' +
    'rather than straight out of the study permit.',
};

const studyPermitMi2026 = {
  id: 'ca-mi-study-permit-2026',
  kind: 'policy' as const,
  instrument:
    'Ministerial Instructions with respect to the processing of certain applications for a study permit made by a foreign national as a member of the student class, Canada Gazette Part I, Vol. 159, No. 51 (20 December 2025)',
  provision: 'Scope; Conditions; Maximum number; Effective period',
  url: STUDY_PERMIT_MI_2026_URL,
  jurisdiction: 'CA',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL INSTRUMENT, NOT STATUTE. Given under s. 87.3 of the Act and published under s. 87.3(6). A study ' +
    'permit application within the scope of these Instructions made on or after 1 January 2026 must include a ' +
    'provincial or territorial attestation letter issued in the 2026 allocation year; without one the application ' +
    'is not accepted for processing and the fee is returned. Several categories are outside the scope, including ' +
    'primary and secondary level applications, exchange students, and applications to study in a master’s or ' +
    'doctoral programme at a public designated learning institution. The Instructions authorise a maximum of ' +
    '309,670 in-scope applications to be accepted for processing between 1 January and 31 December 2026, allocated ' +
    'among the provinces and territories, and they expire on 31 December 2026. Instructions for a later period are ' +
    'a separate instrument and must be read before relying on any of this.',
};

// ---------------------------------------------------------------------------
// Employer-specific work permit supported by a labour market impact assessment
// ---------------------------------------------------------------------------

/**
 * The ordinary route, and the reason the CUSMA permits are worth having.
 *
 * Almost every criterion that decides this application is a fact about the
 * employer and the local labour market rather than about the applicant: whether
 * the employer advertised, whether the wage matches the prevailing rate for the
 * occupation and region, whether the employer is compliant. Meridian holds none
 * of them, which is why the determination itself escalates to a person. That is
 * not a gap in the encoding — it is an accurate picture of where the decision
 * actually sits.
 */
export const caLmiaWorkPermit: Pathway = {
  id: 'ca-lmia-work-permit',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Employer-specific work permit supported by a labour market impact assessment',
    es: 'Permiso de trabajo con empleador determinado, respaldado por una evaluación de impacto en el mercado laboral',
  },
  summary: {
    en:
      'The ordinary work route. An employer in Canada asks Employment and Social Development Canada to assess the ' +
      'offer of employment, and an officer may issue the permit only after making a positive determination on that ' +
      'assessment. The treaty routes exist to avoid this step, not to duplicate it.',
    es:
      'La vía laboral ordinaria. Un empleador en Canadá solicita a Employment and Social Development Canada que ' +
      'evalúe la oferta de empleo, y el oficial solo puede expedir el permiso tras una determinación positiva ' +
      'sobre esa evaluación. Las vías basadas en tratados existen precisamente para evitar este paso.',
  },
  citations: [irpaS30, irprS200, irprS203, irprS315_2],
  criteria: [
    {
      id: 'ca-lmia-offer-of-employment',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-200', 'ca-irpr-s-203'],
      label: {
        en: 'A written offer of employment from an employer in Canada',
        es: 'Oferta de empleo por escrito de un empleador en Canadá',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
        ],
      },
      guidance: {
        en:
          'Section 200(1)(c)(iii) requires that the applicant has been offered employment and that an officer has ' +
          'made a positive determination under ss. 203(1)(a) to (g). The assessment under s. 203(2) is requested ' +
          'by the employer or a group of employers, not by the worker, so an applicant cannot start this route ' +
          'alone. Meridian treats an employer in Canada as part of the route because the assessment is of the ' +
          'Canadian labour market and because the genuineness test in s. 200(5)(d) looks to the employer’s ' +
          'compliance with the employment law of the province where the work will be done. An arrangement in which ' +
          'the employing entity sits outside Canada needs a person to look at it rather than being forced into ' +
          'this shape.',
        es:
          'El art. 200(1)(c)(iii) exige que se haya ofrecido empleo al solicitante y que un oficial haya emitido ' +
          'una determinación positiva conforme a los arts. 203(1)(a) a (g). La evaluación del art. 203(2) la pide ' +
          'el empleador o un grupo de empleadores, no la persona trabajadora, de modo que el solicitante no puede ' +
          'iniciar esta vía por su cuenta. Meridian considera que un empleador en Canadá forma parte de la vía porque ' +
          'la evaluación versa sobre el mercado laboral canadiense y porque el examen de autenticidad del art. ' +
          '200(5)(d) atiende al cumplimiento por el empleador de la legislación laboral de la provincia donde se ' +
          'realizará el trabajo. Un esquema en el que la entidad empleadora se sitúe fuera de Canadá requiere que ' +
          'lo examine una persona, en lugar de forzarlo a encajar aquí.',
      },
    },
    {
      id: 'ca-lmia-positive-determination',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-203', 'ca-irpr-s-200'],
      requiresHumanReview: true,
      label: {
        en: 'A positive determination on the labour market impact assessment',
        es: 'Determinación positiva sobre la evaluación de impacto en el mercado laboral',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.employerName' },
      humanReviewReason: {
        en:
          'Whether the employment is likely to have a neutral or positive effect on the Canadian labour market is ' +
          'decided on facts about the employer and the local market — recruitment efforts, prevailing wages, ' +
          'compliance history, job creation. Meridian holds none of them and will not guess at the outcome.',
        es:
          'Que el empleo tenga probablemente un efecto neutro o positivo en el mercado laboral canadiense se ' +
          'decide con datos sobre el empleador y el mercado local: esfuerzos de reclutamiento, salarios ' +
          'prevalecientes, historial de cumplimiento, creación de empleo. Meridian no dispone de ninguno de ellos ' +
          'y no aventura el resultado.',
      },
      guidance: {
        en:
          'The factors are listed in s. 203(3): direct job creation or retention for Canadian citizens and ' +
          'permanent residents, transfer of skills and knowledge, filling a labour shortage, working conditions ' +
          'meeting generally accepted Canadian standards, hiring or training Canadians, and whether the employer ' +
          'honoured commitments made in earlier assessments.',
        es:
          'Los factores figuran en el art. 203(3): creación o mantenimiento directo de empleo para ciudadanos y ' +
          'residentes permanentes canadienses, transferencia de conocimientos y competencias, cobertura de una ' +
          'escasez de mano de obra, condiciones laborales conformes a los estándares canadienses generalmente ' +
          'aceptados, contratación o formación de canadienses, y cumplimiento de compromisos asumidos en ' +
          'evaluaciones anteriores.',
      },
    },
    {
      id: 'ca-lmia-prevailing-wage',
      kind: 'economic',
      weight: 'material',
      citationIds: ['ca-irpr-s-203'],
      label: {
        en: 'A wage is stated in the offer and is measured against the prevailing rate for the occupation',
        es: 'La oferta indica una retribución, que se contrasta con el salario prevaleciente de la ocupación',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.annualSalaryMinorUnits' },
      guidance: {
        en:
          'Section 203(1.1)(a) is categorical: where the wages set out in the offer are not consistent with the ' +
          'prevailing wage rate for the occupation, the employment is unlikely to have a positive or neutral ' +
          'effect on the labour market. The prevailing rate is published by occupation and region and is revised. ' +
          'Meridian records only that a figure has been supplied; it does not assert the rate or compare against ' +
          'one.',
        es:
          'El art. 203(1.1)(a) es tajante: si la retribución de la oferta no se corresponde con el salario ' +
          'prevaleciente de la ocupación, el empleo no tendrá probablemente un efecto positivo ni neutro en el ' +
          'mercado laboral. Ese salario se publica por ocupación y región y se actualiza. Meridian solo deja ' +
          'constancia de que se ha aportado una cifra; no afirma cuál es el umbral ni compara con él.',
      },
    },
    {
      id: 'ca-lmia-able-to-perform-the-work',
      kind: 'qualification',
      // Informational rather than material on purpose. An absent education
      // field is a half-filled profile, not a finding about the applicant, and
      // s. 200(3)(a) is an officer's assessment against the duties in the offer
      // rather than a threshold anything here could measure.
      weight: 'informational',
      citationIds: ['ca-irpr-s-200'],
      label: {
        en: 'Evidence of the qualifications or experience the job requires is on file',
        es: 'Constan pruebas de la titulación o la experiencia que el puesto exige',
      },
      evaluator: {
        op: 'any_of',
        of: [
          { op: 'is_present', path: 'educationLevel' },
          { op: 'is_present', path: 'professionalExperienceYears' },
          { op: 'is_present', path: 'professionalCredentials' },
        ],
      },
      guidance: {
        en:
          'Section 200(3)(a) obliges an officer to refuse where there are reasonable grounds to believe the ' +
          'applicant is unable to perform the work sought. This criterion checks only whether qualification ' +
          'evidence exists in the record. Whether it establishes ability to do this particular job is the ' +
          'officer’s assessment against the duties in the offer.',
        es:
          'El art. 200(3)(a) obliga al oficial a denegar cuando existan motivos razonables para creer que la ' +
          'persona no puede desempeñar el trabajo solicitado. Este criterio solo comprueba si constan pruebas de ' +
          'cualificación. Que acrediten la aptitud para ese puesto concreto es una valoración del oficial frente ' +
          'a las funciones de la oferta.',
      },
    },
    {
      id: 'ca-lmia-temporary-stay',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-200'],
      label: {
        en: 'The applicant will leave Canada by the end of the authorised period',
        es: 'El solicitante saldrá de Canadá al término del periodo autorizado',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'Section 200(1)(b). The exemption in s. 200(2) covers only the categories in s. 206 and paragraphs ' +
          '207(c) and (d), which this route is not.',
        es:
          'Art. 200(1)(b). La exención del art. 200(2) solo alcanza a las categorías del art. 206 y a los ' +
          'apartados 207(c) y (d), entre las que esta vía no se encuentra.',
      },
    },
    {
      id: 'ca-lmia-no-recorded-overstay',
      kind: 'status',
      weight: 'informational',
      citationIds: ['ca-irpr-s-200', 'ca-irpa-s-30'],
      label: {
        en: 'No overstay is recorded in the applicant’s travel history',
        es: 'No consta ninguna estancia irregular en el historial de viajes del solicitante',
      },
      evaluator: { op: 'lte', path: 'travelHistory.priorOverstays', value: 0 },
      guidance: {
        en:
          'This checks the travel-history summary and nothing more. The rule it points at is wider: s. 200(3)(e) ' +
          'obliges an officer to refuse a work permit where the applicant has engaged in unauthorised study or ' +
          'work in Canada or has failed to comply with a condition of a previous permit, until six months have ' +
          'elapsed since that ended, subject to the exceptions in that paragraph. Meridian does not record ' +
          'unauthorised work, so an empty result here is not a clean answer to that question.',
        es:
          'Esto comprueba el resumen del historial de viajes y nada más. La regla a la que apunta es más amplia: ' +
          'el art. 200(3)(e) obliga al oficial a denegar el permiso cuando la persona haya estudiado o trabajado ' +
          'sin autorización en Canadá o haya incumplido una condición de un permiso anterior, hasta que ' +
          'transcurran seis meses desde el cese, con las excepciones de ese apartado. Meridian no registra el ' +
          'trabajo no autorizado, de modo que un resultado vacío aquí no responde a esa pregunta.',
      },
    },
    {
      id: 'ca-lmia-fees-are-the-employers',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['ca-irpr-s-315-2', 'ca-irpr-s-203'],
      label: {
        en: 'An employer is on file, so the assessment fee rules apply to this offer',
        es: 'Consta un empleador, por lo que las reglas sobre la tasa de evaluación se aplican a esta oferta',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.employerName' },
      guidance: {
        en:
          'A fee of CAD 1,000 is payable under s. 315.2(1) for each offer of employment for which an assessment is ' +
          'requested, at the time of the request, with exceptions for seasonal agricultural work, other primary ' +
          'agriculture, and certain in-home care. Section 203(1)(e) makes it a failing of the assessment if the ' +
          'employer, directly or indirectly, charged or recovered that fee or recruitment fees from the worker. If ' +
          'someone has asked an applicant to pay it, that is a matter to raise, not to absorb.',
        es:
          'El art. 315.2(1) fija una tasa de 1.000 CAD por cada oferta de empleo para la que se solicita ' +
          'evaluación, pagadera al presentar la solicitud, con excepciones para el trabajo agrícola de temporada, ' +
          'la agricultura primaria y ciertos cuidados en domicilio. El art. 203(1)(e) hace que la evaluación ' +
          'decaiga si el empleador cobró o repercutió, directa o indirectamente, esa tasa o gastos de ' +
          'reclutamiento a la persona trabajadora. Si a alguien le han pedido pagarla, eso es algo que denunciar, ' +
          'no que asumir.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-s-203'],
    note: {
      en:
        'Section 203(3.1) requires the assessment to state the period during which it is in effect; the length of ' +
        'the permit itself is set by the officer. Meridian states no figure for either, and no processing time — ' +
        'none is fixed by the Regulations.',
      es:
        'El art. 203(3.1) exige que la evaluación indique el periodo durante el cual está en vigor; la duración ' +
        'del permiso la fija el oficial. Meridian no afirma ninguna de las dos cifras, ni plazo de tramitación ' +
        'alguno: el Reglamento no fija ninguno.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// CUSMA trader
// ---------------------------------------------------------------------------

export const caCusmaTrader: Pathway = {
  id: 'ca-cusma-trader',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'CUSMA trader work permit',
    es: 'Permiso de trabajo para comerciantes del T-MEC',
  },
  summary: {
    en:
      'A work permit for a citizen of Mexico or the United States entering Canada to carry on substantial trade in ' +
      'goods or services principally between Canada and their own country, without a labour market impact ' +
      'assessment.',
    es:
      'Permiso de trabajo para nacionales de México o Estados Unidos que entran a Canadá a desarrollar un comercio ' +
      'sustancial de bienes o servicios principalmente entre Canadá y su propio país, sin evaluación de impacto en ' +
      'el mercado laboral.',
  },
  citations: [irprS204, cusmaSectionB, cusmaCitizenshipOnly, cusmaDefinitions, cusmaJointReview, irprEmployerCompliance],
  criteria: [
    {
      id: 'ca-cusma-trader-citizenship',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['ca-cusma-citizenship-requirement', 'ca-cusma-art-16-1-definitions'],
      label: {
        en: 'Citizenship of Mexico or the United States, held and claimed',
        es: 'Nacionalidad mexicana o estadounidense, ostentada y alegada',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...NON_CANADIAN_CUSMA_PARTIES] },
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
        ],
      },
      guidance: {
        en:
          'The claimed nationality matters twice over on this route. It is the citizenship the treaty attaches to, ' +
          'and it also fixes the country the trade must be principally between — so a dual national has to decide ' +
          'which passport the trade is measured against before anything else is assessed.',
        es:
          'En esta vía la nacionalidad alegada cuenta dos veces: es la ciudadanía a la que se vincula el tratado y ' +
          'además determina el país entre el que debe darse principalmente el comercio. Quien tenga doble ' +
          'nacionalidad debe decidir con qué pasaporte se mide el comercio antes de valorar nada más.',
      },
    },
    {
      id: 'ca-cusma-trader-substantial-trade',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-b'],
      requiresHumanReview: true,
      label: {
        en: 'Substantial trade in goods or services, principally between Canada and the country of citizenship',
        es: 'Comercio sustancial de bienes o servicios, principalmente entre Canadá y el país de nacionalidad',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Whether trade is substantial, and whether it is principally between the two countries, is measured on ' +
          'the trading record of an enterprise. Meridian records no trade volumes or counterparties, and the ' +
          'Agreement fixes no percentage or value, so there is nothing here to compute.',
        es:
          'Que el comercio sea sustancial y que se dé principalmente entre los dos países se mide sobre el ' +
          'historial comercial de una empresa. Meridian no registra volúmenes ni contrapartes, y el Acuerdo no ' +
          'fija porcentaje ni importe alguno, de modo que aquí no hay nada que calcular.',
      },
      guidance: {
        en:
          'Section B(1)(a) uses the words "substantial trade" and "principally" and defines neither. Any numeric ' +
          'test applied in practice comes from Canada’s own measures rather than from the treaty, so ask for the ' +
          'test actually being applied and the evidence it needs before assembling the file.',
        es:
          'La sección B(1)(a) emplea las expresiones «comercio sustancial» y «principalmente» sin definir ninguna. ' +
          'Cualquier criterio numérico que se aplique en la práctica procede de las medidas propias de Canadá y no ' +
          'del tratado: pregunte cuál es el criterio que efectivamente se aplica y qué pruebas exige antes de ' +
          'preparar el expediente.',
      },
    },
    {
      id: 'ca-cusma-trader-capacity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-b'],
      requiresHumanReview: true,
      label: {
        en: 'The role is supervisory or executive, or involves essential skills',
        es: 'El puesto es de supervisión o dirección, o exige aptitudes esenciales',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.occupationCode' },
      humanReviewReason: {
        en:
          'Two separate problems. Meridian records no fact describing the seniority or essentiality of a role. And ' +
          'the qualifier itself is textually ambiguous — see the guidance.',
        es:
          'Dos problemas distintos. Meridian no registra ningún dato sobre el nivel jerárquico ni el carácter ' +
          'esencial del puesto. Y el propio inciso es textualmente ambiguo: véase la orientación.',
      },
      guidance: {
        en:
          'In the published text of Section B, the phrase "in a capacity that is supervisory, executive or ' +
          'involves essential skills" sits at the end of paragraph (b), after the investor limb, and it is not ' +
          'typographically clear whether it also governs the trader limb in paragraph (a). Meridian does not ' +
          'resolve that reading. Confirm against Canada’s own measures whether the capacity requirement is applied ' +
          'to traders, because the answer decides whether a junior trading role is inside the category at all.',
        es:
          'En el texto publicado de la sección B, la expresión «en una función de supervisión, de dirección o que ' +
          'exija aptitudes esenciales» aparece al final del apartado (b), tras el inciso relativo al inversor, y ' +
          'no queda tipográficamente claro si rige también el inciso (a), relativo al comerciante. Meridian no ' +
          'resuelve esa lectura. Confirme en las medidas propias de Canadá si el requisito de función se aplica a ' +
          'los comerciantes: de ello depende que un puesto comercial de nivel inicial encaje o no en la categoría.',
      },
    },
    {
      id: 'ca-cusma-trader-temporary-entry',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-cusma-art-16-1-definitions', 'ca-cusma-annex-16a-section-b'],
      label: {
        en: 'The entry is temporary',
        es: 'La entrada tiene carácter temporal',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'Article 16.1 defines temporary entry as entry without the intent to establish permanent residence, and ' +
          'art. 16.2(2) puts residence and permanent employment outside the Chapter entirely.',
        es:
          'El art. 16.1 define la entrada temporal como la entrada sin intención de establecer residencia ' +
          'permanente, y el art. 16.2(2) deja la residencia y el empleo permanente enteramente fuera del capítulo.',
      },
    },
    {
      id: 'ca-cusma-trader-employer-steps',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['ca-irpr-employer-compliance'],
      label: {
        en: 'A written offer of employment is on file, which brings the employer filing and fee steps into play',
        es: 'Consta una oferta de empleo por escrito, lo que activa los trámites y la tasa a cargo del empleador',
      },
      evaluator: { op: 'is_true', path: 'jobOffer.writtenOffer' },
      guidance: {
        en:
          'A trader who works for a Canadian employer applies on the s. 200(1)(c)(ii.1) route, and the employer ' +
          'must submit the offer of employment and pay the CAD 230 fee before the applicant applies; an officer ' +
          'must refuse under s. 200(3)(f.1) if either step is missing. A trader with no offer of employment ' +
          'applies on the s. 200(1)(c)(ii) route instead, and none of this applies.',
        es:
          'El comerciante que trabaja para un empleador canadiense solicita por la vía del art. 200(1)(c)(ii.1), y ' +
          'el empleador debe presentar la oferta de empleo y abonar la tasa de 230 CAD antes de que el solicitante ' +
          'presente su solicitud; el oficial debe denegar conforme al art. 200(3)(f.1) si falta cualquiera de los ' +
          'dos pasos. Quien no tenga oferta de empleo solicita por la vía del art. 200(1)(c)(ii), y nada de esto ' +
          'le resulta aplicable.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-s-204', 'ca-cusma-joint-review'],
    note: {
      en:
        'The permit is issued under s. 204(a) of the Regulations as work performed under an international ' +
        'agreement, which is what removes the labour market impact assessment. The length of the grant and of any ' +
        'extension is set by the officer under Canada’s own measures; Meridian states no figure. The Agreement ' +
        'itself remains in force until 2036 on the Government of Canada’s own account, so the route rests on a ' +
        'live instrument — but the Chapter is subject to a Joint Review process and is worth re-checking rather ' +
        'than assumed.',
      es:
        'El permiso se expide al amparo del art. 204(a) del Reglamento, como trabajo realizado en virtud de un ' +
        'acuerdo internacional, y eso es lo que suprime la evaluación de impacto en el mercado laboral. La ' +
        'duración de la concesión y de sus prórrogas la fija el oficial conforme a las medidas propias de Canadá; ' +
        'Meridian no afirma ninguna cifra. Según el propio Gobierno de Canadá, el Acuerdo permanece en vigor hasta ' +
        '2036, de modo que la vía se apoya en un instrumento vigente; ahora bien, el capítulo está sujeto a un ' +
        'proceso de Examen Conjunto y conviene volver a comprobarlo en lugar de darlo por supuesto.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// CUSMA investor
// ---------------------------------------------------------------------------

export const caCusmaInvestor: Pathway = {
  id: 'ca-cusma-investor',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'CUSMA investor work permit',
    es: 'Permiso de trabajo para inversionistas del T-MEC',
  },
  summary: {
    en:
      'A work permit for a citizen of Mexico or the United States entering Canada to establish, develop, ' +
      'administer or advise on an investment to which they or their enterprise have committed a substantial amount ' +
      'of capital, in a supervisory or executive role or one involving essential skills.',
    es:
      'Permiso de trabajo para nacionales de México o Estados Unidos que entran a Canadá a establecer, desarrollar, ' +
      'administrar o asesorar una inversión a la que ellos o su empresa han comprometido una cantidad sustancial ' +
      'de capital, en una función de supervisión o dirección o que exija aptitudes esenciales.',
  },
  citations: [irprS204, cusmaSectionB, cusmaCitizenshipOnly, cusmaDefinitions, cusmaJointReview, irprS87_1],
  criteria: [
    {
      id: 'ca-cusma-inv-citizenship',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['ca-cusma-citizenship-requirement', 'ca-cusma-art-16-1-definitions'],
      label: {
        en: 'Citizenship of Mexico or the United States, held and claimed',
        es: 'Nacionalidad mexicana o estadounidense, ostentada y alegada',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...NON_CANADIAN_CUSMA_PARTIES] },
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
        ],
      },
    },
    {
      id: 'ca-cusma-inv-substantial-capital',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-b'],
      requiresHumanReview: true,
      label: {
        en: 'A substantial amount of capital committed, or in the process of being committed',
        es: 'Cantidad sustancial de capital comprometida, o en proceso de comprometerse',
      },
      evaluator: { op: 'is_present', path: 'qualifyingInvestment.minorUnits' },
      humanReviewReason: {
        en:
          'The Agreement says "a substantial amount of capital" and stops there. It sets no figure, no currency ' +
          'and no proportion of the enterprise’s value, so there is no threshold for this engine to apply.',
        es:
          'El Acuerdo dice «una cantidad sustancial de capital» y no va más allá. No fija importe, ni moneda, ni ' +
          'proporción sobre el valor de la empresa, de modo que no hay umbral alguno que este motor pueda aplicar.',
      },
      guidance: {
        en:
          'Meridian records whether an amount is on file and in what currency, and nothing more. Both the capital ' +
          'and the commitment matter: Section B(1)(b) covers capital already committed and capital in the process ' +
          'of being committed, which is a different evidentiary problem from a completed transfer.',
        es:
          'Meridian solo deja constancia de si consta un importe y en qué moneda. Importan tanto el capital como ' +
          'el compromiso: la sección B(1)(b) abarca el capital ya comprometido y el que está en proceso de ' +
          'comprometerse, lo que plantea un problema probatorio distinto al de una transferencia ya consumada.',
      },
    },
    {
      id: 'ca-cusma-inv-capacity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-b'],
      requiresHumanReview: true,
      label: {
        en: 'The role is supervisory or executive, or involves essential skills',
        es: 'El puesto es de supervisión o dirección, o exige aptitudes esenciales',
      },
      evaluator: { op: 'is_present', path: 'employmentType' },
      humanReviewReason: {
        en:
          'Meridian records the form of employment but nothing that describes the seniority of a role or the ' +
          'essentiality of a skill, and Section B provides no test for either.',
        es:
          'Meridian registra la forma de empleo, pero nada que describa el nivel jerárquico del puesto ni el ' +
          'carácter esencial de una aptitud, y la sección B no ofrece criterio alguno para ninguno de los dos.',
      },
      guidance: {
        en:
          'On this limb of Section B the qualifier is unambiguous — it applies to the investor. The activity ' +
          'itself is also defined: establishing, developing, administering, or providing advice or key technical ' +
          'services to the operation of the investment. Passive ownership is not on that list.',
        es:
          'En este inciso de la sección B el requisito es inequívoco: se aplica al inversionista. También está ' +
          'definida la actividad: establecer, desarrollar, administrar o prestar asesoramiento o servicios ' +
          'técnicos clave a la explotación de la inversión. La titularidad pasiva no figura en esa lista.',
      },
    },
    {
      id: 'ca-cusma-inv-temporary-entry',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-cusma-art-16-1-definitions', 'ca-cusma-annex-16a-section-b'],
      label: {
        en: 'The entry is temporary',
        es: 'La entrada tiene carácter temporal',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
    },
    {
      id: 'ca-cusma-inv-self-employment-and-later-routes',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'Whether the work is self-employment changes what it is worth later',
        es: 'Que el trabajo sea por cuenta propia cambia lo que valdrá más adelante',
      },
      evaluator: { op: 'is_false', path: 'jobOffer.selfEmployment' },
      guidance: {
        en:
          'An investor may run their own enterprise or be employed by it, and the treaty does not care which. The ' +
          'Canadian Experience Class does: s. 87.1(3)(b) excludes any period of self-employment from the year of ' +
          'Canadian work experience the class requires. Time spent here can therefore be worth a great deal or ' +
          'nothing at all toward permanent residence, depending on how the working relationship is structured — ' +
          'which is a question worth asking at the start rather than three years in.',
        es:
          'Un inversionista puede dirigir su propia empresa o estar empleado por ella, y al tratado le resulta ' +
          'indiferente. A la Clase de Experiencia Canadiense no: el art. 87.1(3)(b) excluye todo periodo de ' +
          'trabajo por cuenta propia del año de experiencia laboral canadiense que la clase exige. El tiempo aquí ' +
          'puede valer mucho o nada de cara a la residencia permanente según cómo se estructure la relación ' +
          'laboral, y esa es una pregunta que conviene hacerse al principio y no tres años después.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-s-204', 'ca-cusma-joint-review'],
    note: {
      en:
        'Issued under s. 204(a) as work performed under an international agreement, which is what removes the ' +
        'labour market impact assessment. Length of grant and extension are set by the officer under Canada’s own ' +
        'measures; Meridian states no figure. The Agreement remains in force until 2036 on the Government of ' +
        'Canada’s own account.',
      es:
        'Se expide al amparo del art. 204(a), como trabajo realizado en virtud de un acuerdo internacional, y eso ' +
        'es lo que suprime la evaluación de impacto en el mercado laboral. La duración de la concesión y de sus ' +
        'prórrogas la fija el oficial conforme a las medidas propias de Canadá; Meridian no afirma ninguna cifra. ' +
        'Según el propio Gobierno de Canadá, el Acuerdo permanece en vigor hasta 2036.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// CUSMA intra-company transferee
// ---------------------------------------------------------------------------

export const caCusmaIntraCompanyTransferee: Pathway = {
  id: 'ca-cusma-intra-company-transferee',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'CUSMA intra-company transferee work permit',
    es: 'Permiso de trabajo por traslado dentro de la empresa (T-MEC)',
  },
  summary: {
    en:
      'A work permit for a citizen of Mexico or the United States employed by an enterprise and transferred to ' +
      'render services to that enterprise or a subsidiary or affiliate of it in Canada, in a managerial or ' +
      'executive capacity or one involving specialized knowledge.',
    es:
      'Permiso de trabajo para nacionales de México o Estados Unidos empleados por una empresa y trasladados a ' +
      'prestar servicios a esa empresa o a una filial o afiliada suya en Canadá, en una función directiva o ' +
      'ejecutiva o que implique conocimientos especializados.',
  },
  citations: [irprS204, cusmaSectionC, cusmaCitizenshipOnly, cusmaDefinitions, cusmaJointReview, irprEmployerCompliance],
  criteria: [
    {
      id: 'ca-cusma-ict-citizenship',
      kind: 'nationality',
      weight: 'blocking',
      citationIds: ['ca-cusma-citizenship-requirement', 'ca-cusma-art-16-1-definitions'],
      label: {
        en: 'Citizenship of Mexico or the United States, held and claimed',
        es: 'Nacionalidad mexicana o estadounidense, ostentada y alegada',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'one_of', path: 'claimedNationality', values: [...NON_CANADIAN_CUSMA_PARTIES] },
          { op: 'set_contains_field', path: 'nationalities', otherPath: 'claimedNationality' },
        ],
      },
      guidance: {
        en:
          'Being transferred by a multinational is not the same as holding a Party’s citizenship. An employee of a ' +
          'United States company who is a citizen of a fourth country is outside Chapter 16 no matter how long ' +
          'they have worked there.',
        es:
          'Ser trasladado por una multinacional no equivale a tener la nacionalidad de una Parte. Un empleado de ' +
          'una empresa estadounidense que sea nacional de un tercer país queda fuera del capítulo 16, por mucho ' +
          'tiempo que lleve trabajando allí.',
      },
    },
    {
      id: 'ca-cusma-ict-canadian-receiving-entity',
      kind: 'employment',
      // Material, not blocking. Section C covers rendering services to "that
      // enterprise or a subsidiary or affiliate thereof", and the enterprise
      // itself may be the foreign one — a transferee posted to an unincorporated
      // Canadian branch is inside the Section but may be recorded against the
      // parent's country. Treating a non-CA value as fatal would be reading a
      // limit into the text that is not there.
      weight: 'material',
      citationIds: ['ca-cusma-annex-16a-section-c'],
      label: {
        en: 'The entity named on the offer is recorded as being in Canada',
        es: 'La entidad que figura en la oferta consta como situada en Canadá',
      },
      evaluator: { op: 'equals', path: 'jobOffer.employerCountry', value: 'CA' },
      guidance: {
        en:
          'Section C allows services to be rendered to the enterprise itself or to a subsidiary or affiliate of ' +
          'it, so an offer naming a non-Canadian entity is not automatically outside the category — a branch is ' +
          'not a separate company. What has to be shown is where the services will actually be performed and how ' +
          'the two entities are related.',
        es:
          'La sección C permite prestar servicios a la propia empresa o a una filial o afiliada suya, de modo que ' +
          'una oferta que nombre a una entidad no canadiense no queda automáticamente fuera de la categoría: una ' +
          'sucursal no es una sociedad distinta. Lo que debe acreditarse es dónde se prestarán realmente los ' +
          'servicios y cómo se relacionan ambas entidades.',
      },
    },
    {
      id: 'ca-cusma-ict-corporate-relationship',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-c'],
      requiresHumanReview: true,
      label: {
        en: 'The Canadian entity is the same enterprise, or a subsidiary or affiliate of it',
        es: 'La entidad canadiense es la misma empresa o una filial o afiliada suya',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.employerName' },
      humanReviewReason: {
        en:
          'Meridian records a single employer name on the offer and does not link it to the applicant’s earlier ' +
          'employer, so the corporate relationship the Section requires cannot be established from the record.',
        es:
          'Meridian registra un único nombre de empleador en la oferta y no lo vincula con el empleador anterior ' +
          'del solicitante, de modo que la relación societaria que exige la sección no puede acreditarse a partir ' +
          'del expediente.',
      },
      guidance: {
        en:
          'This is the criterion that most often decides an intra-company transfer, and it is documentary: ' +
          'ownership and control between the sending and the receiving entity have to be shown, not asserted.',
        es:
          'Este es el criterio que más a menudo decide un traslado dentro de la empresa, y es documental: la ' +
          'propiedad y el control entre la entidad de origen y la receptora deben acreditarse, no afirmarse.',
      },
    },
    {
      id: 'ca-cusma-ict-one-year-in-three',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-c'],
      requiresHumanReview: true,
      label: {
        en: 'Continuous employment by the enterprise for one year within the preceding three years, where required',
        es: 'Empleo continuo en la empresa durante un año dentro de los tres años anteriores, cuando se exija',
      },
      evaluator: { op: 'is_present', path: 'workExperience' },
      humanReviewReason: {
        en:
          'Two things are missing. Meridian records periods of work experience without identifying the employer, ' +
          'so continuity with one enterprise cannot be measured. And the requirement is optional in the treaty — ' +
          'Section C says a Party MAY require it — so whether Canada applies it, and how it counts interruptions, ' +
          'comes from Canada’s own measures.',
        es:
          'Faltan dos cosas. Meridian registra periodos de experiencia laboral sin identificar al empleador, de ' +
          'modo que no puede medirse la continuidad en una misma empresa. Y el requisito es potestativo en el ' +
          'tratado —la sección C dice que una Parte PODRÁ exigirlo—, así que si Canadá lo aplica, y cómo computa ' +
          'las interrupciones, procede de sus propias medidas.',
      },
      guidance: {
        en:
          'Where the year is required it is measured backwards from the date of the application for admission, so ' +
          'the same facts can qualify one month and not the next. Establish the exact employment dates before ' +
          'booking anything.',
        es:
          'Cuando se exige el año, se computa hacia atrás desde la fecha de la solicitud de admisión, por lo que ' +
          'los mismos hechos pueden cumplir un mes y no cumplir al siguiente. Determine las fechas exactas de ' +
          'empleo antes de reservar nada.',
      },
    },
    {
      id: 'ca-cusma-ict-capacity',
      kind: 'employment',
      weight: 'blocking',
      citationIds: ['ca-cusma-annex-16a-section-c'],
      requiresHumanReview: true,
      label: {
        en: 'The role is managerial or executive, or involves specialized knowledge',
        es: 'El puesto es directivo o ejecutivo, o implica conocimientos especializados',
      },
      evaluator: { op: 'is_present', path: 'jobOffer.occupationCode' },
      humanReviewReason: {
        en:
          'Meridian records an occupation code, which says what the job is called, not whether it is managerial, ' +
          'executive, or founded on knowledge specialized enough to satisfy Section C.',
        es:
          'Meridian registra un código de ocupación, que indica cómo se denomina el puesto, no si es directivo, ' +
          'ejecutivo o se basa en conocimientos lo bastante especializados como para cumplir la sección C.',
      },
      guidance: {
        en:
          'Note that Section C uses "specialized knowledge" here, where Section B uses "essential skills" for ' +
          'traders and investors. They are different words in the same Annex and should not be treated as ' +
          'interchangeable.',
        es:
          'Obsérvese que la sección C emplea aquí «conocimientos especializados», mientras que la sección B usa ' +
          '«aptitudes esenciales» para comerciantes e inversionistas. Son términos distintos dentro del mismo ' +
          'anexo y no deben tratarse como intercambiables.',
      },
    },
    {
      id: 'ca-cusma-ict-temporary-entry',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-cusma-art-16-1-definitions', 'ca-cusma-annex-16a-section-c'],
      label: {
        en: 'The entry is temporary',
        es: 'La entrada tiene carácter temporal',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
    },
    {
      id: 'ca-cusma-ict-employer-steps',
      kind: 'procedural',
      weight: 'material',
      citationIds: ['ca-irpr-employer-compliance'],
      label: {
        en: 'A written offer of employment is on file, which brings the employer filing and fee steps into play',
        es: 'Consta una oferta de empleo por escrito, lo que activa los trámites y la tasa a cargo del empleador',
      },
      evaluator: { op: 'is_true', path: 'jobOffer.writtenOffer' },
      guidance: {
        en:
          'An intra-company transferee has an employer by definition, so this route runs through s. ' +
          '200(1)(c)(ii.1): the Canadian entity must submit the offer of employment and the prescribed information ' +
          'and pay the CAD 230 fee before the applicant applies, and an officer must refuse under s. 200(3)(f.1) ' +
          'if either is outstanding. Meridian sees only whether a written offer is recorded; it cannot see the ' +
          'submission or the payment.',
        es:
          'Un traslado dentro de la empresa presupone un empleador, por lo que esta vía discurre por el art. ' +
          '200(1)(c)(ii.1): la entidad canadiense debe presentar la oferta de empleo y la información exigida y ' +
          'abonar la tasa de 230 CAD antes de que el solicitante presente su solicitud, y el oficial debe denegar ' +
          'conforme al art. 200(3)(f.1) si falta alguna de las dos. Meridian solo ve si consta una oferta por ' +
          'escrito; no puede ver ni la presentación ni el pago.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-s-204', 'ca-cusma-joint-review'],
    note: {
      en:
        'Issued under s. 204(a) as work performed under an international agreement. Section C sets no maximum ' +
        'period and no numerical limit; the length of the grant and of any extension is set by the officer under ' +
        'Canada’s own measures, and Meridian states no figure. The Agreement remains in force until 2036 on the ' +
        'Government of Canada’s own account.',
      es:
        'Se expide al amparo del art. 204(a), como trabajo realizado en virtud de un acuerdo internacional. La ' +
        'sección C no fija periodo máximo ni límite numérico; la duración de la concesión y de sus prórrogas la ' +
        'fija el oficial conforme a las medidas propias de Canadá, y Meridian no afirma ninguna cifra. Según el ' +
        'propio Gobierno de Canadá, el Acuerdo permanece en vigor hasta 2036.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Study permit
// ---------------------------------------------------------------------------

export const caStudyPermit: Pathway = {
  id: 'ca-study-permit',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'residence_permit',
  status: 'open',
  name: {
    en: 'Study permit',
    es: 'Permiso de estudios',
  },
  summary: {
    en:
      'Authorisation to study in Canada at a designated learning institution. It is the first step of the route ' +
      'most graduates take to permanent residence, but only the first: work done while studying full time does not ' +
      'count toward the Canadian Experience Class, so the bridge runs through a post-graduation work permit.',
    es:
      'Autorización para estudiar en Canadá en una institución de enseñanza designada. Es el primer paso de la ' +
      'vía que la mayoría de los egresados sigue hacia la residencia permanente, pero solo el primero: el trabajo ' +
      'realizado mientras se estudia a tiempo completo no computa para la Clase de Experiencia Canadiense, de modo ' +
      'que el puente pasa por un permiso de trabajo posgraduación.',
  },
  citations: [
    irpaS30,
    irpaS22DualIntent,
    irprS216,
    irprS219,
    irprS220,
    irprS211_1,
    irprStudyConditions,
    irprS87_1,
    studyPermitMi2026,
  ],
  criteria: [
    {
      id: 'ca-sp-temporary-stay',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-216', 'ca-irpa-s-22-2'],
      label: {
        en: 'The applicant will leave Canada by the end of the authorised period',
        es: 'El solicitante saldrá de Canadá al término del periodo autorizado',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'Section 216(1)(b) of the Regulations. This is not a bar on wanting to stay: s. 22(2) of the Act ' +
          'provides that an intention to become a permanent resident does not preclude temporary resident status ' +
          'if the officer is satisfied the person will leave by the end of the authorised period. The two ' +
          'propositions sit together uncomfortably in practice, and how an officer weighs them is not something ' +
          'this engine models.',
        es:
          'Art. 216(1)(b) del Reglamento. No es una prohibición de querer quedarse: el art. 22(2) de la Ley ' +
          'establece que la intención de convertirse en residente permanente no impide obtener la condición de ' +
          'residente temporal si el oficial se convence de que la persona saldrá al término del periodo ' +
          'autorizado. Ambas proposiciones conviven con dificultad en la práctica, y cómo las pondera un oficial ' +
          'no es algo que este motor modele.',
      },
    },
    {
      id: 'ca-sp-acceptance-at-designated-institution',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-216', 'ca-irpr-s-219', 'ca-irpr-s-211-1'],
      requiresHumanReview: true,
      label: {
        en: 'Accepted to a course or programme at a designated learning institution',
        es: 'Admitido a un curso o programa en una institución de enseñanza designada',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Meridian’s applicant record holds no letter of acceptance and no institution identifier, so neither the ' +
          'acceptance nor the institution’s designation can be checked here.',
        es:
          'El expediente del solicitante en Meridian no contiene carta de admisión ni identificador de la ' +
          'institución, de modo que aquí no puede comprobarse ni la admisión ni la designación de la institución.',
      },
      guidance: {
        en:
          'For a post-secondary institution the acceptance is not enough on its own: s. 216(1)(e) and s. 219(1)(a) ' +
          'require the institution itself to confirm it to the Minister under s. 222.1(1)(a). Designation is made ' +
          'by the province (s. 211.1) and can be withdrawn. Separately, s. 216(3) bars a permit for study in ' +
          'Quebec where Quebec law requires a Certificat d’acceptation du Québec and the applicant does not hold ' +
          'one — a provincial document that has to be obtained before the federal application, not after it.',
        es:
          'En una institución de enseñanza superior la admisión no basta por sí sola: los arts. 216(1)(e) y ' +
          '219(1)(a) exigen que la propia institución la confirme al Ministro conforme al art. 222.1(1)(a). La ' +
          'designación la otorga la provincia (art. 211.1) y puede retirarse. Por otra parte, el art. 216(3) ' +
          'impide expedir el permiso para estudiar en Quebec cuando la legislación quebequesa exija un Certificat ' +
          'd’acceptation du Québec y el solicitante no lo tenga: un documento provincial que debe obtenerse antes ' +
          'de la solicitud federal, no después.',
      },
    },
    {
      id: 'ca-sp-financial-resources',
      kind: 'economic',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-220'],
      requiresHumanReview: true,
      label: {
        en: 'Sufficient and available financial resources, without working in Canada',
        es: 'Recursos económicos suficientes y disponibles, sin trabajar en Canadá',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Meridian records income streams, not available funds, and s. 220 is about funds. Measuring the test ' +
          'against the wrong quantity would be worse than not measuring it, so it goes to a person.',
        es:
          'Meridian registra flujos de ingresos, no fondos disponibles, y el art. 220 se refiere a fondos. Medir ' +
          'el requisito contra la magnitud equivocada sería peor que no medirlo, por lo que se remite a una ' +
          'persona.',
      },
      guidance: {
        en:
          'The Regulations require enough to pay tuition, to maintain the applicant and any accompanying family ' +
          'members for the proposed period of study, and to pay transport to and from Canada — and they set no ' +
          'figure at all. The amount applied in practice is departmental, is revised, and is not stated anywhere ' +
          'in this catalog. Ask what figure is current on the day the application is made.',
        es:
          'El Reglamento exige lo suficiente para pagar la matrícula, mantener al solicitante y a los familiares ' +
          'que le acompañen durante el periodo de estudios previsto y costear el transporte de ida y vuelta a ' +
          'Canadá, y no fija importe alguno. La cantidad que se aplica en la práctica es departamental, se ' +
          'actualiza y no consta en ningún punto de este catálogo. Pregunte qué cifra rige el día en que se ' +
          'presente la solicitud.',
      },
    },
    {
      id: 'ca-sp-provincial-attestation-letter',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-mi-study-permit-2026'],
      requiresHumanReview: true,
      label: {
        en: 'A provincial or territorial attestation letter, where the application is within the capped scope',
        es: 'Carta de atestación provincial o territorial, si la solicitud entra en el ámbito sujeto a cupo',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'CA' },
      humanReviewReason: {
        en:
          'Whether an application needs an attestation letter turns on the level and place of the intended study ' +
          'and on the type of institution, none of which Meridian records — it holds the applicant’s existing ' +
          'education, not the programme they are about to start.',
        es:
          'Que una solicitud necesite carta de atestación depende del nivel y el lugar de los estudios previstos y ' +
          'del tipo de institución, datos que Meridian no registra: guarda la formación ya cursada por el ' +
          'solicitante, no el programa que va a iniciar.',
      },
      guidance: {
        en:
          'This is an intake condition, not an eligibility rule: an in-scope application filed without the letter ' +
          'is not accepted for processing at all and the fee is returned. Applications at the primary or ' +
          'secondary level, from exchange students, and for a master’s or doctoral programme at a public ' +
          'designated learning institution are outside the scope, among other exclusions listed in the ' +
          'Instructions. The letters are allocated province by province and run out. The Instructions in this ' +
          'record take effect on 1 January 2026 and expire on 31 December 2026 — an application made after that ' +
          'is governed by a different instrument, which must be read before anything here is relied on.',
        es:
          'Se trata de una condición de admisión a trámite, no de un requisito de elegibilidad: una solicitud ' +
          'comprendida en el ámbito que se presente sin la carta no se admite siquiera a trámite y se devuelve la ' +
          'tasa. Quedan fuera del ámbito, entre otras exclusiones que enumeran las Instrucciones, las solicitudes ' +
          'de nivel primario o secundario, las de estudiantes de intercambio y las de programas de máster o ' +
          'doctorado en instituciones de enseñanza designadas públicas. Las cartas se reparten por provincias y se ' +
          'agotan. Las Instrucciones recogidas aquí entran en vigor el 1 de enero de 2026 y expiran el 31 de ' +
          'diciembre de 2026: una solicitud posterior se rige por otro instrumento, que debe leerse antes de ' +
          'apoyarse en nada de lo anterior.',
      },
    },
    {
      id: 'ca-sp-conditions-and-what-the-time-is-worth',
      kind: 'status',
      weight: 'informational',
      citationIds: ['ca-irpr-study-permit-conditions', 'ca-irpr-s-87-1', 'ca-irpa-s-30'],
      label: {
        en: 'The applicant currently holds student status in Canada',
        es: 'El solicitante ostenta actualmente la condición de estudiante en Canadá',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'student' },
      guidance: {
        en:
          'A holder must enrol at the institution named in the permit, remain enrolled until they complete their ' +
          'studies, and actively pursue the programme (s. 220.1(1)); an officer may ask for evidence of that at ' +
          'any time. The permit becomes invalid 90 days after studies are completed (s. 222(1)(a)), which is the ' +
          'clock that matters when planning the next step. And the time itself is worth less than people assume: ' +
          's. 87.1(3)(a) excludes any period of employment during which the applicant was engaged in full-time ' +
          'study from the year of experience the Canadian Experience Class requires. That single sentence is why ' +
          'this route leads to a post-graduation work permit rather than straight to permanent residence.',
        es:
          'El titular debe matricularse en la institución que figura en el permiso, permanecer matriculado hasta ' +
          'terminar sus estudios y cursarlos de forma activa (art. 220.1(1)); el oficial puede pedir pruebas de ' +
          'ello en cualquier momento. El permiso pierde validez 90 días después de completarse los estudios (art. ' +
          '222(1)(a)), y ese es el reloj que importa al planificar el paso siguiente. Además, ese tiempo vale ' +
          'menos de lo que se supone: el art. 87.1(3)(a) excluye todo periodo de empleo durante el cual la persona ' +
          'estuviera estudiando a tiempo completo del año de experiencia que exige la Clase de Experiencia ' +
          'Canadiense. Esa única frase explica por qué esta vía conduce a un permiso de trabajo posgraduación y no ' +
          'directamente a la residencia permanente.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-study-permit-conditions', 'ca-mi-study-permit-2026'],
    note: {
      en:
        'The permit runs for the period the officer sets and becomes invalid on the earliest of 90 days after the ' +
        'studies are completed, the day the holder is no longer enrolled for any other reason, cancellation, or ' +
        'expiry. Meridian publishes no processing-time figure: none is set by the Regulations, and the intake ' +
        'Instructions govern whether an application is taken up at all rather than how fast it moves.',
      es:
        'El permiso rige durante el periodo que fije el oficial y pierde validez en la primera de estas fechas: 90 ' +
        'días después de completarse los estudios, el día en que el titular deje de estar matriculado por ' +
        'cualquier otro motivo, la cancelación o el vencimiento. Meridian no publica plazos de tramitación: el ' +
        'Reglamento no fija ninguno, y las Instrucciones de admisión regulan si una solicitud llega a tramitarse, ' +
        'no con qué rapidez avanza.',
    },
  },
  leadsTo: ['ca-post-graduation-work-permit'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Post-graduation work permit
// ---------------------------------------------------------------------------

/**
 * The hinge of the study route, and the record in this file that asserts the
 * least on purpose.
 *
 * The permit rests on s. 205(c)(ii) of the Regulations, which authorises the
 * Minister to designate work that may be performed by a foreign national where
 * limited labour-market access serves public policy on the competitiveness of
 * Canada's academic institutions or economy. The Regulations grant the power and
 * stop there. Everything an applicant actually needs to satisfy — how long and
 * at what level the programme must have been, how soon after finishing they must
 * apply, what language result is required, and whether the field of study must
 * appear on a published list — is the Minister's designation, and a designation
 * can be replaced overnight without any legislative step.
 *
 * Those criteria have in fact been changed more than once, which is exactly why
 * no figure appears here. A superseded eligibility rule stated confidently is
 * more dangerous than an absent one: a person reads it, believes they qualify or
 * that they do not, and acts.
 */
export const caPostGraduationWorkPermit: Pathway = {
  id: 'ca-post-graduation-work-permit',
  version: '1.0.0',
  jurisdiction: CA,
  kind: 'work_permit',
  status: 'open',
  name: {
    en: 'Post-graduation work permit',
    es: 'Permiso de trabajo posgraduación',
  },
  summary: {
    en:
      'An open work permit for a person who has completed a programme of study in Canada, issued under the ' +
      'Minister’s designation rather than under a labour market impact assessment. It is what converts a study ' +
      'permit into work experience that counts, and it is the step the Canadian Experience Class is usually ' +
      'reached from.',
    es:
      'Permiso de trabajo abierto para quien ha completado un programa de estudios en Canadá, expedido en virtud ' +
      'de la designación del Ministro y no de una evaluación de impacto en el mercado laboral. Es lo que convierte ' +
      'un permiso de estudios en experiencia laboral computable y suele ser el paso desde el que se alcanza la ' +
      'Clase de Experiencia Canadiense.',
  },
  citations: [irprS205, irprS200, irprS211_1, irprStudyConditions, irpaS22DualIntent, irprS87_1],
  criteria: [
    {
      id: 'ca-pgwp-studies-completed-in-canada',
      kind: 'qualification',
      // Studying in Canada is definitional for this permit, but the fact this
      // reads holds one country of education for the whole applicant. Someone
      // with a foreign bachelor's and a Canadian master's can be recorded either
      // way, so a non-CA value here is a prompt to look, not a finding of
      // ineligibility. Material caps it at indeterminate.
      weight: 'material',
      citationIds: ['ca-irpr-s-205', 'ca-irpr-s-211-1'],
      label: {
        en: 'The country of education on file is Canada',
        es: 'El país de formación que consta es Canadá',
      },
      evaluator: { op: 'equals', path: 'educationCountry', value: 'CA' },
      guidance: {
        en:
          'The applicant record holds one country of education, so a person who studied in more than one country ' +
          'has to be assessed on the Canadian programme specifically rather than on this field. The institution ' +
          'must be a designated learning institution as defined in s. 211.1, and designation is provincial and ' +
          'revocable. Being designated is not by itself enough: which programmes at which institutions lead to ' +
          'this permit is part of the Minister’s designation, not part of s. 211.1.',
        es:
          'El expediente del solicitante guarda un único país de formación, de modo que quien haya estudiado en ' +
          'varios países debe valorarse específicamente por el programa cursado en Canadá y no por este campo. La ' +
          'institución debe ser una institución de enseñanza designada en el sentido del art. 211.1, y la ' +
          'designación es provincial y revocable. Estar designada no basta por sí solo: qué programas de qué ' +
          'instituciones dan acceso a este permiso forma parte de la designación del Ministro, no del art. 211.1.',
      },
    },
    {
      id: 'ca-pgwp-minister-designated-criteria',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-205', 'ca-irpr-s-200'],
      requiresHumanReview: true,
      label: {
        en: 'The criteria the Minister has designated for this permit, as they stand on the day of application',
        es: 'Los criterios que el Ministro ha designado para este permiso, tal como rijan el día de la solicitud',
      },
      evaluator: { op: 'is_present', path: 'educationLevel' },
      humanReviewReason: {
        en:
          'Meridian does not restate the designated criteria. They are made by the Minister rather than by ' +
          'regulation, they have been changed more than once, and quoting a version that has since been replaced ' +
          'would tell someone they qualify — or that they do not — on the strength of a rule that no longer ' +
          'exists.',
        es:
          'Meridian no reproduce los criterios designados. Los fija el Ministro y no el reglamento, se han ' +
          'modificado en más de una ocasión, y citar una versión ya sustituida diría a alguien que cumple —o que ' +
          'no cumple— apoyándose en una regla que ya no existe.',
      },
      guidance: {
        en:
          'Section 205(c)(ii) is the head of power and says only that the work is designated by the Minister on ' +
          'the basis that limited access to the Canadian labour market is necessary for reasons of public policy ' +
          'relating to the competitiveness of Canada’s academic institutions or economy. The operative conditions ' +
          '— the minimum length and level of the programme, the window for applying after completing it, any ' +
          'language result, and any requirement that the field of study appear on a published list — sit in the ' +
          'designation. Read the version in force on the day the application is made, and check the date on ' +
          'whatever you are reading.',
        es:
          'El art. 205(c)(ii) es la norma habilitante y se limita a decir que el trabajo lo designa el Ministro ' +
          'por considerar que un acceso limitado al mercado laboral canadiense es necesario por razones de ' +
          'política pública relativas a la competitividad de las instituciones académicas o de la economía de ' +
          'Canadá. Las condiciones operativas —duración y nivel mínimos del programa, plazo para solicitar tras ' +
          'terminarlo, resultado lingüístico exigido y cualquier requisito de que el campo de estudio figure en ' +
          'una lista publicada— están en la designación. Consulte la versión vigente el día en que se presente la ' +
          'solicitud, y compruebe la fecha de lo que esté leyendo.',
      },
    },
    {
      id: 'ca-pgwp-temporary-stay',
      kind: 'intent',
      weight: 'blocking',
      citationIds: ['ca-irpr-s-200', 'ca-irpa-s-22-2'],
      label: {
        en: 'The applicant will leave Canada by the end of the authorised period',
        es: 'El solicitante saldrá de Canadá al término del periodo autorizado',
      },
      evaluator: { op: 'is_true', path: 'intent.temporary' },
      guidance: {
        en:
          'Section 200(1)(b) applies to this permit; the exemption in s. 200(2) does not reach it. Section 22(2) ' +
          'of the Act nevertheless provides that intending to become a permanent resident does not preclude ' +
          'temporary resident status where the officer is satisfied the person will leave at the end of the ' +
          'authorised period. Most holders of this permit are on the route to permanent residence, and that is ' +
          'not, in itself, a contradiction.',
        es:
          'El art. 200(1)(b) se aplica a este permiso; la exención del art. 200(2) no lo alcanza. Aun así, el art. ' +
          '22(2) de la Ley establece que pretender la residencia permanente no impide la condición de residente ' +
          'temporal cuando el oficial se convence de que la persona saldrá al término del periodo autorizado. La ' +
          'mayoría de los titulares de este permiso están en la vía hacia la residencia permanente, y eso no ' +
          'constituye en sí mismo una contradicción.',
      },
    },
    {
      id: 'ca-pgwp-timing-after-completion',
      kind: 'status',
      weight: 'informational',
      citationIds: ['ca-irpr-study-permit-conditions'],
      label: {
        en: 'The applicant currently holds student status in Canada',
        es: 'El solicitante ostenta actualmente la condición de estudiante en Canadá',
      },
      evaluator: { op: 'equals', path: 'currentStatus', value: 'student' },
      guidance: {
        en:
          'Section 222(1)(a) is in the Regulations and is fixed. The separate window for applying for this permit ' +
          'is not in the Regulations and is set by the Minister, so the two dates are not the same thing and ' +
          'should not be conflated. Establish both before the studies end, not after.',
        es:
          'El art. 222(1)(a) está en el Reglamento y es fijo. El plazo, distinto, para solicitar este permiso no ' +
          'está en el Reglamento y lo fija el Ministro, de modo que ambas fechas no son lo mismo y no deben ' +
          'confundirse. Determine las dos antes de terminar los estudios, no después.',
      },
    },
    {
      id: 'ca-pgwp-experience-that-counts',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['ca-irpr-s-87-1'],
      label: {
        en: 'Work under this permit can count toward the Canadian Experience Class',
        es: 'El trabajo con este permiso puede computar para la Clase de Experiencia Canadiense',
      },
      evaluator: {
        op: 'collection_any',
        path: 'workExperience',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals', path: 'country', value: 'CA' },
            { op: 'gte', path: 'nocTeer', value: 0 },
            { op: 'lte', path: 'nocTeer', value: 3 },
          ],
        },
      },
      guidance: {
        en:
          'Section 87.1(3) sets three limits worth knowing before the first job is taken: employment during ' +
          'full-time study does not count, self-employment does not count, and the applicant must hold temporary ' +
          'resident status throughout. Work under this permit clears all three, which is precisely what it is ' +
          'for. The occupation still has to fall in TEER 0, 1, 2 or 3 for the class, so the first job taken after ' +
          'graduating can decide whether the year counts at all.',
        es:
          'El art. 87.1(3) impone tres límites que conviene conocer antes de aceptar el primer empleo: el trabajo ' +
          'durante estudios a tiempo completo no computa, el trabajo por cuenta propia tampoco, y la persona debe ' +
          'mantener la condición de residente temporal durante todo el periodo. El trabajo con este permiso supera ' +
          'los tres, que es justamente para lo que sirve. La ocupación debe además situarse en TEER 0, 1, 2 o 3 ' +
          'para la clase, de modo que el primer empleo tras graduarse puede decidir si el año computa o no.',
      },
    },
  ],
  durations: {
    citationIds: ['ca-irpr-s-205'],
    note: {
      en:
        'The length of the permit is part of the Minister’s designation, not of the Regulations, and Meridian ' +
        'states no figure for it. Time on this permit is temporary residence, not permanent residence.',
      es:
        'La duración del permiso forma parte de la designación del Ministro, no del Reglamento, y Meridian no ' +
        'afirma ninguna cifra al respecto. El tiempo con este permiso es residencia temporal, no permanente.',
    },
  },
  leadsTo: ['ca-express-entry-cec'],
  reviewStatus: 'unreviewed',
};

export const CA_WORK_STUDY_PATHWAYS: readonly Pathway[] = [
  caLmiaWorkPermit,
  caCusmaTrader,
  caCusmaInvestor,
  caCusmaIntraCompanyTransferee,
  caStudyPermit,
  caPostGraduationWorkPermit,
];
