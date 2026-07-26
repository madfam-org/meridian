/**
 * Spain — *arraigo*: temporary residence on exceptional grounds of rootedness.
 *
 * This is the route for people who are already in Spain without status, and it
 * is the most-used one. Since **20 May 2025** it is governed by the Reglamento
 * de la Ley Orgánica 4/2000 approved by **Real Decreto 1155/2024, de 19 de
 * noviembre** (BOE núm. 280 of 20 November 2024), which repealed Real Decreto
 * 557/2011 in full. That Reglamento has been amended once, by **Real Decreto
 * 316/2026, de 14 de abril** (BOE núm. 92 of 15 April 2026, in force 16 April
 * 2026), which is where the current wording of arts. 126.h), 127.c), 130.5 and
 * 132.2.a) comes from and where the two 2026 windows were added.
 *
 * Six records here: the **five figures art. 125 currently provides** —
 * *segunda oportunidad*, *sociolaboral*, *social*, *socioformativo* and
 * *familiar* — plus one closed 2026 window, *arraigo extraordinario*, kept
 * because people who filed inside it are waiting on decisions now and a 404 is
 * not an answer for them.
 *
 * ## If you are searching for the old names
 *
 * The 2025 Reglamento renamed and restructured these figures. Against the
 * repealed RD 557/2011 art. 124:
 *
 * | RD 557/2011 (repealed) | Today |
 * |---|---|
 * | *arraigo laboral* — 2 years' presence plus ≥6 months of proven past work | **Gone under that name.** The employment figure is now *arraigo sociolaboral*, and it looks forward to a contract rather than back at work already done |
 * | *arraigo social* — **3 years'** presence, contract of **30 h/week** (20 with dependants), family ties or an *informe de arraigo* | *arraigo social*, **2 years'** presence, no contract requirement; the contract moved to *sociolaboral* at **20 h/week** |
 * | *arraigo para la formación* — 2 years | renamed ***arraigo socioformativo***, 2 years |
 * | *arraigo familiar* — built around family members of **Spanish** nationals | narrowed to family members of **EU/EEA/Swiss** nationals; the Spanish-national cases moved out of arraigo into Título IV Capítulo VII, arts. 93–99, *Residencia temporal de familiares de personas con nacionalidad española* |
 * | — | **new**: *arraigo de segunda oportunidad*, 2 years |
 *
 * Two of those are easy to get wrong from memory and expensive when you do: the
 * *arraigo social* period is **two** years, not three, and *arraigo familiar*
 * no longer runs on a tie to a Spanish national.
 *
 * ## Why so much of this escalates to a person
 *
 * Two structural reasons, and both are properties of the law rather than of the
 * engine.
 *
 * First, **arraigo turns on physical presence, not on legal residence**, and
 * {@link import('../facts.js').ApplicantFacts} models legal residence. An
 * applicant for arraigo is, by construction, someone whose presence is not on
 * any residence register. There is no honest way to measure art. 126.b) from
 * the facts this engine holds, so the criterion carries
 * `requiresHumanReview` rather than quietly answering `unknown` forever.
 *
 * Second, several requirements are **evidenced by an administrative report or
 * a family fact this engine does not hold** — the *informe de integración
 * social* from the Comunidad Autónoma, enrolment in a named training, the
 * nationality of a relative. Those criteria carry `requiresHumanReview` too,
 * and where no fact bears on them at all their evaluator is a deliberate
 * placeholder (`targetJurisdiction === 'ES'`, which is true of every applicant
 * this record could concern). The placeholder decides nothing: an escalated
 * criterion never returns `met` or `unmet`. What the reader gets is the rule,
 * its pin-cite, and a statement of exactly which fact a person has to go and
 * establish.
 *
 * The consequence is that every record here reports
 * `verdict: 'requires_human_review'`. That is the accurate answer. The
 * per-criterion results are still returned, so the parts that *can* be checked
 * — criminal record, holding another authorisation, the wage against the SMI —
 * are checked and shown.
 *
 * ## Statute against practice
 *
 * The Reglamento fixes no number for the absences compatible with "continuous"
 * presence, no total IPREM figure for the family-ties route, and no minimum
 * length for a fixed-term contract. All three numbers applicants are actually
 * measured against come from **Instrucciones SEM 1/2025**, signed by the
 * Secretaria de Estado de Migraciones on 13 May 2025. They are ministerial
 * guidance, revisable without legislative process, and every citation to them
 * here carries `discretionary: true` so a report says so out loud.
 *
 * ## Out of scope
 *
 * Asylum, refugee protection and humanitarian residence are **not in this
 * catalog**, by decision rather than by omission. They turn on credibility
 * assessment rather than criteria, they concern people at risk, and a
 * self-serve eligibility checker is the wrong instrument for them. That covers
 * art. 128 (humanitarian grounds) and Título VII Capítulos II–V (victims of
 * gender violence, sexual violence and trafficking). **Anyone with a protection
 * claim, or who thinks they may have one, should take it to a lawyer or to a
 * specialised organisation rather than to this engine.**
 *
 * One nearby record is deliberately absent for the same reason. *Disposición
 * adicional vigésima*, added by RD 316/2026, was a one-year residence route for
 * people who had claimed international protection before 1 January 2026, and a
 * favourable decision on it **obliged the applicant to withdraw the protection
 * claim or the pending appeal** (DA 20.4). That trade is not one to nudge
 * anybody through, it closed to new applications on the same day as *arraigo
 * extraordinario*, and it is not encoded here.
 *
 * Every record ships `reviewStatus: 'unreviewed'`. Nothing in this file has
 * been read by a licensed person.
 */

import { countryCode, isoDate, type CountryCode } from '@meridian/core';
import type { Pathway } from '../schema.js';

const ES: CountryCode = countryCode('ES');

/** Single verification date for this file. Every citation below was read on this day. */
const VERIFIED_ON = isoDate('2026-07-25');

/**
 * The day the current arraigo regime began accepting applications: RD 1155/2024
 * entered into force six months after publication (disposición final cuarta).
 */
const RLOEX_IN_FORCE = isoDate('2025-05-20');

/**
 * The first day *arraigo extraordinario* could no longer be applied for.
 *
 * DA 21.6 says the authorisation *"podrá ser solicitada hasta el 30 de junio de
 * 2026"*, and *hasta* there is inclusive — 30 June was a filing day. {@link
 * import('../schema.js').statusOn} treats `closedOn` as the first date the route
 * is unavailable, so the value is 1 July, not 30 June. Off by one here would
 * tell somebody who filed on the last day that they filed after closure.
 */
const EXTRAORDINARIO_CLOSED_ON = isoDate('2026-07-01');

// ---------------------------------------------------------------------------
// Citations
//
// The Real Decreto approves a Reglamento, and almost every provision below is
// an article *of the Reglamento* rather than of the Real Decreto — hence the
// instrument string. BOE serves the consolidated text, amendments included, at
// one URL; the `note` is what tells the reader which wording they are looking
// at.
// ---------------------------------------------------------------------------

const RLOEX_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099';

const SEM_URL =
  'https://www.inclusion.gob.es/documents/d/migraciones/instrucciones-sem-1_2025-sobre-las-autorizaciones-de-residencia-temporal-por-circunstancias-excepcionales-por-razon-de-arraigo-aprobado-por-el-real-decreto-1155_2024';

const rloexArt125 = {
  id: 'es-arraigo-rloex-art-125',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 125',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Art. 125.1 grants temporary residence on grounds of arraigo to people in Spain who have economic, ' +
    'social, family, employment or educational ties to where they live, in five types: segunda oportunidad, ' +
    'sociolaboral, social, socioformativo and familiar. Art. 125.2: "La duración de estas autorizaciones es ' +
    'de un año, salvo por razón de arraigo familiar, cuya duración será de cinco años." The Reglamento was ' +
    'published in BOE núm. 280 of 20 November 2024 and entered into force on 20 May 2025.',
};

const rloexArt126 = {
  id: 'es-arraigo-rloex-art-126',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 126',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'General requirements, which apply cumulatively to all five figures: being in Spain and not being an ' +
    'applicant for international protection when the application is filed or while it is processed (a); ' +
    'having been in Spain continuously for at least the two years before filing, with arraigo familiar ' +
    'expressly excused and time spent while a protection claim was pending not counted (b); not being a ' +
    'threat to public order, security or public health (c); having no criminal record in Spain or in the ' +
    'countries of residence during the five years before entering Spain, for offences that exist in Spanish ' +
    'law (d); not being listed as inadmissible in the territory of states with which Spain has an agreement ' +
    'to that effect (e); not being within a non-return commitment period (f); and having paid the fee (g). ' +
    'Letter h) was added with effect from 16 April 2026 — see the RD 316/2026 citation. Art. 126.b) requires ' +
    'presence "de forma continuada" and fixes no number of permitted days of absence.',
};

const rd316_2026 = {
  id: 'es-arraigo-rd-316-2026',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 316/2026, de 14 de abril, por el que se modifica el Real Decreto 1155/2024, de 19 de noviembre',
  url: 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8284',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'BOE núm. 92 of 15 April 2026, in force 16 April 2026 (the day after publication). It added art. 126.h) ' +
    '— "No ser titular de una autorización de estancia o residencia ni ostentar la condición de persona ' +
    'interesada en procedimientos que tengan por objeto la concesión, prórroga, renovación o modificación de ' +
    'autorizaciones de estancia o residencia" — rewrote arts. 127.c) and 132.2.a), amended art. 130.5, added ' +
    'disposiciones adicionales vigésima and vigesimoprimera to the Reglamento, and repealed its disposición ' +
    'transitoria quinta. BOE serves the amended wording at the Reglamento URL.',
};

const rloexArt127a = {
  id: 'es-arraigo-rloex-art-127-a',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 127.a)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Arraigo de segunda oportunidad: the applicant must have held a residence authorisation — one not granted ' +
    'on exceptional-circumstances grounds — in the two years immediately before the application, and its ' +
    'renewal must not have failed to happen for reasons of public order, security or public health. The route ' +
    'remains open where there is an acquittal, a dismissal or a decision denying the penalty. This figure did ' +
    'not exist under RD 557/2011.',
};

const rloexArt127b = {
  id: 'es-arraigo-rloex-art-127-b',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 127.b)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Arraigo sociolaboral: one or more employment contracts guaranteeing at least the salario mínimo ' +
    'interprofesional, or the wage set by the applicable collective agreement, in proportion to the hours ' +
    'worked, and together representing "una jornada semanal no inferior a veinte horas en cómputo global". ' +
    'More than one contract is admitted for seasonal work and for simultaneous part-time work with more than ' +
    'one employer. The employer or employers must meet the requirements of art. 74 except art. 74.1.a). The ' +
    'twenty-hour figure replaces the thirty hours RD 557/2011 art. 124.2.b) required for arraigo social.',
};

const rloexArt127c = {
  id: 'es-arraigo-rloex-art-127-c',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 127.c)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'Arraigo social, in the wording given by RD 316/2026 with effect from 16 April 2026. Two routes, both ' +
    'requiring means of at least 100% of the IPREM available in Spain: family ties to other foreign nationals ' +
    'who hold a residence authorisation, limited to a spouse or registered partner and first-degree relatives ' +
    'in the direct line; or, where those ties are not shown, "se valorará el esfuerzo de integración de la ' +
    'persona extranjera", evidenced by a favourable social-integration report from the competent bodies of ' +
    'the Comunidad Autónoma of the applicant’s place of residence — or from the Corporación local of their ' +
    'habitual address where the Comunidad Autónoma has so provided and has told the Secretaría de Estado de ' +
    'Migraciones. The report is due within one month of being asked for; if it is not issued in time and the ' +
    'applicant proves that, the requirement may be met by any means of proof admissible in law. The 2026 ' +
    'wording records what the report must contain — time at the habitual address, the means available, and ' +
    'integration efforts through socio-labour and cultural insertion programmes — replacing the 2025 wording, ' +
    'which had required it to certify knowledge and respect of constitutional values and, where applicable, ' +
    'the learning of the official languages. MARKED DISCRETIONARY because the regulation delegates a ' +
    'judgement rather than fixing a threshold: it says the integration effort "se valorará" and requires a ' +
    '*favourable* report. A person who satisfies every documentary requirement can still be assessed ' +
    'unfavourably, and the assessment is made by the Comunidad Autónoma, not by this engine.',
};

const rloexArt127d = {
  id: 'es-arraigo-rloex-art-127-d',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 127.d)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Arraigo socioformativo: enrolment in, or attendance at, one of the trainings referred to in arts. ' +
    '52.1.b) and 52.1.e).5.º of the Reglamento — the latter including level one — or the in-person offer of ' +
    'compulsory adult education. Where enrolment has an official window, the application must be filed in the ' +
    'two months before that window opens; proof of enrolment must reach the oficina de extranjería within ' +
    'three months of notification of the grant, and failure to prove it in time extinguishes the ' +
    'authorisation. Alternatively, a commitment to training promoted by the public employment services and ' +
    'aimed at occupations in the catalogue referred to in art. 75.1; failure to prove that training was done ' +
    'likewise extinguishes the authorisation. A social-integration report under art. 127.c) is also required. ' +
    'This figure was called *arraigo para la formación* under RD 557/2011 art. 124.4.',
};

const rloexArt127e = {
  id: 'es-arraigo-rloex-art-127-e',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 127.e)',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Arraigo familiar, in two cases, and in both the family member must be "nacional de otro Estado miembro ' +
    'de la Unión Europea, del Espacio Económico Europeo o de Suiza". 1.º the applicant is the father, mother ' +
    'or guardian of a minor who is such a national, resides in Spain, has the minor in their care and lives ' +
    'with the minor or is up to date with parental obligations. 2.º the applicant provides support to a person ' +
    'with a disability who is such a national for the exercise of their legal capacity, and is a relative of ' +
    'that person, has them in their care and lives with them.',
};

const rloexArt130 = {
  id: 'es-arraigo-rloex-art-130',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 130',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Procedure. No visa is required and the application is filed in person by the applicant, except for ' +
    'minors and people who need support to exercise their legal capacity. Art. 130.2: for arraigo the ' +
    'applicant supplies a criminal-record certificate from the country or countries where they lived during ' +
    'the five years before entering Spain; the oficina de extranjería obtains the Spanish record and a police ' +
    'report of its own motion. No third-country certificate is needed where the applicant has been in Spain ' +
    'continuously for the five years immediately before filing, or has already proved that in an application ' +
    'within those five years and has not left since. A record in the police report is not by itself and ' +
    'automatically a ground of refusal; the competent body assesses it case by case. Art. 130.5, in the ' +
    'wording given by RD 316/2026, provisionally authorises an arraigo sociolaboral applicant to reside and ' +
    'work as an employee once the application is admitted and until it is decided. Art. 130.6: the foreigner ' +
    'identity card must be applied for within one month of notification of the grant.',
};

const rloexArt131 = {
  id: 'es-arraigo-rloex-art-131',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 131',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'The residence authorisation carries a work authorisation, employed or self-employed, with no ' +
    'geographical or occupational limit, for as long as the residence lasts. Two exceptions: applicants below ' +
    'the minimum working age, and arraigo socioformativo, which permits employed work of at most thirty hours ' +
    'a week in aggregate, paid at least the salario mínimo interprofesional or the applicable ' +
    'collective-agreement wage in proportion to the hours worked.',
};

const rloexArt132 = {
  id: 'es-arraigo-rloex-art-132',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'art. 132',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Prórroga. Art. 132.1: these authorisations and their prórrogas run one year, except arraigo familiar at ' +
    'five. Art. 132.2.a), in the wording given by RD 316/2026: a prórroga of second-chance, sociolaboral or ' +
    'social arraigo is conditional on proof of actively seeking work and being registered with the public ' +
    'employment service, "No obstante, se podrá prorrogar sin necesidad de acreditar los anteriores requisitos ' +
    'si concurren circunstancias que impidan el acceso al empleo por razones debidamente justificadas, tales ' +
    'como, enfermedad o discapacidad o haber alcanzado la edad legal de jubilación." The 2025 wording had also ' +
    'required continued satisfaction of the original requirements; RD 316/2026 dropped that. Art. 132.2.b): a ' +
    'prórroga of socioformativo arraigo is conditional on a report from the training centre certifying ' +
    'promotion to the second year, or, where the training finished early, on the qualification obtained plus ' +
    'active job-seeking. Art. 132.3: the application is made in the two months before expiry, which extends ' +
    'the previous authorisation until the procedure is resolved; filing within three months after expiry also ' +
    'extends it, without prejudice to a penalty procedure.',
};

const rloexDt3 = {
  id: 'es-arraigo-rloex-dt-3',
  kind: 'regulation' as const,
  instrument: 'Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'disposición transitoria tercera',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'People who, on the strength of a family tie to a Spanish national, held an arraigo familiar authorisation ' +
    'or an EU-family-member residence card valid when the Reglamento entered into force keep their residence ' +
    'while they satisfy Título IV Capítulo VII, without having to file the new application. That is the bridge ' +
    'for the narrowing of arraigo familiar to EU, EEA and Swiss nationals.',
};

const rloexDa21 = {
  id: 'es-arraigo-rloex-da-21',
  kind: 'regulation' as const,
  instrument:
    'Reglamento de la Ley Orgánica 4/2000, aprobado por Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'disposición adicional vigesimoprimera',
  url: RLOEX_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'Arraigo extraordinario, added by RD 316/2026 art. único.12 with effect from 16 April 2026. Open to people ' +
    'who were in Spain before 1 January 2026 and who cumulatively: are of full age, are in Spain when they ' +
    'file and hold no stay or residence authorisation (a); are not an interested party in a pending procedure ' +
    'for one (b); neither hold nor have held a residence authorisation under Council Implementing Decision ' +
    '(EU) 2022/382 on temporary protection for people displaced from Ukraine (c); supply a full copy of a ' +
    'passport, cédula de inscripción or travel document, current or expired (d); have been in Spain ' +
    'uninterruptedly for the five months before filing, provable by any evidence admissible in law (e); have ' +
    'no criminal record in the terms of art. 126.d) (f); are not a threat to public order, public security or ' +
    'public health, assessed case by case, a police-report entry not being automatically a ground of refusal ' +
    '(g); are not listed as inadmissible under a bilateral agreement (h); are not within a non-return ' +
    'commitment period (i); and have paid the fee (j). DA 21.2 additionally requires at least one of: work ' +
    'done in Spain or an intention to work, evidenced by a job offer or, for self-employment, a declaración ' +
    'responsable, with fixed-term contracts or their sum having to exceed ninety days in a year; living in ' +
    'Spain with a family unit of minor children, adult children with a disability or who cannot objectively ' +
    'provide for themselves, or first-degree ascendants they live with; or a certified situation of ' +
    'vulnerability. DA 21.6: "podrá ser solicitada hasta el 30 de junio de 2026". DA 21.10: the authorisation ' +
    'runs one year with full employed and self-employed work rights.',
};

const rd557Art124 = {
  id: 'es-arraigo-rd-557-2011-art-124-derogado',
  kind: 'regulation' as const,
  instrument:
    'Real Decreto 557/2011, de 20 de abril, por el que se aprueba el Reglamento de la Ley Orgánica 4/2000 (derogado)',
  provision: 'art. 124',
  url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-7703',
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  note:
    'REPEALED WITH EFFECT FROM 20 MAY 2025 and cited only so the predecessor figures are findable. It provided ' +
    'arraigo laboral (two years’ presence plus employment relationships of not less than six months, proved ' +
    'as at least 30 hours a week over six months or 15 hours a week over twelve), arraigo social (three ' +
    'years’ presence, a contract of not less than thirty hours a week — twenty where the applicant had ' +
    'dependants — and either family ties to resident foreign nationals or an informe de arraigo from the ' +
    'Comunidad Autónoma), arraigo familiar (parent or guardian of a **Spanish** minor, person supporting a ' +
    'Spanish national with a disability, spouse or partner and certain ascendants and descendants of a ' +
    'Spanish national, and children of a formerly-Spanish parent), and arraigo para la formación (two years’ ' +
    'presence plus a commitment to regulated training). Applications lodged before 20 May 2025 are still ' +
    'processed and decided under the law in force when they were filed, unless the applicant elects the new ' +
    'Reglamento (RD 1155/2024 disposición transitoria segunda).',
};

const semPermanencia = {
  id: 'es-arraigo-sem-1-2025-permanencia',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucciones SEM 1/2025 de la Secretaría de Estado de Migraciones sobre las autorizaciones de ' +
    'residencia temporal por circunstancias excepcionales por razón de arraigo previstas en el Reglamento ' +
    'de Extranjería aprobado por el Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Instrucción primera',
  url: SEM_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL GUIDANCE, NOT REGULATION. Art. 126.b) of the Reglamento requires continuous presence and ' +
    'fixes no number. The number applicants are measured against is Instrucción primera.2: "A efectos del ' +
    'cómputo de permanencia continuada, las ausencias de España no podrán superar los 90 días naturales en un ' +
    'período de dos años." Instrucción primera.3 adds that the status of applicant for international ' +
    'protection is acquired from the moment the wish to claim is expressed, and that if the applicant ' +
    'withdraws the claim they satisfy art. 126.a) from that moment and the presence count in art. 126.b) ' +
    'starts or resumes. Signed by the Secretaria de Estado de Migraciones on 13 May 2025. A ministerial ' +
    'instruction can be reissued without any legislative process; counsel must check the current text.',
};

const semContrato = {
  id: 'es-arraigo-sem-1-2025-contrato',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucciones SEM 1/2025 de la Secretaría de Estado de Migraciones sobre las autorizaciones de ' +
    'residencia temporal por circunstancias excepcionales por razón de arraigo previstas en el Reglamento ' +
    'de Extranjería aprobado por el Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Instrucción tercera',
  url: SEM_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL GUIDANCE, NOT REGULATION. On arraigo sociolaboral: the "cómputo global" of the weekly hours ' +
    'in art. 127.b) may be calculated over the whole length of the contract (tercera.1); any contractual form ' +
    'in the employment legislation is acceptable provided the stated wage is paid, and fixed-term contracts, ' +
    'or their sum, "deberán tener una duración superior a 90 días" (tercera.2); the reference in art. 127.b) ' +
    'to the employer’s art. 74 obligations is read as arts. 74.d) and e) — being up to date with tax and ' +
    'Social Security obligations, and having economic, material or personal means sufficient for the business ' +
    'and for the obligations owed to the worker (tercera.4); and art. 127.b) "no permite acceder al arraigo ' +
    'sociolaboral mediante la acreditación de una actividad por cuenta propia" (tercera.5). Neither the ' +
    'ninety-day figure nor the self-employment exclusion appears in art. 127.b) itself.',
};

const semMedios = {
  id: 'es-arraigo-sem-1-2025-medios',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucciones SEM 1/2025 de la Secretaría de Estado de Migraciones sobre las autorizaciones de ' +
    'residencia temporal por circunstancias excepcionales por razón de arraigo previstas en el Reglamento ' +
    'de Extranjería aprobado por el Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Instrucción cuarta',
  url: SEM_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL GUIDANCE, NOT REGULATION. On the means for arraigo social, the instruction reads art. 127.c) ' +
    'as requiring twice what the regulation states on the family-ties route: "deberá acreditarse 100% por el ' +
    'familiar con residencia legal, respecto al que se acredite el vínculo y 100% para el solicitante del ' +
    'arraigo, en total un 200% del IPREM, con independencia de los miembros que conformen la unidad de ' +
    'convivencia" (cuarta.3). Art. 127.c) says only "al menos, el 100 % del IPREM". The instruction also ' +
    'requires the means to exist at the moment of application and to be maintained for the life of the ' +
    'authorisation, allows them to come from a qualifying relative who is legally resident and lives with the ' +
    'applicant, and computes periodic income under the family-reunification rules in art. 67.1 (cuarta.2 and ' +
    'cuarta.4). The doubling is the ministry’s reading, not the regulation’s text.',
};

const semSegundaOportunidad = {
  id: 'es-arraigo-sem-1-2025-segunda-oportunidad',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucciones SEM 1/2025 de la Secretaría de Estado de Migraciones sobre las autorizaciones de ' +
    'residencia temporal por circunstancias excepcionales por razón de arraigo previstas en el Reglamento ' +
    'de Extranjería aprobado por el Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Instrucción segunda',
  url: SEM_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL GUIDANCE, NOT REGULATION. The earlier authorisation must have been capable of renewal or ' +
    'prórroga; the route is available where the renewal could not be made because the filing window expired ' +
    'or because it was refused for failure to meet its requirements. It is not available where the earlier ' +
    'authorisation lost its effect through a ground of extinction, save the one in art. 200.1 of the ' +
    'Reglamento, nor where the renewal failed for reasons of public order, security or public health, save on ' +
    'a dismissal or an acquittal.',
};

const semFamiliar = {
  id: 'es-arraigo-sem-1-2025-familiar',
  kind: 'official_guidance' as const,
  instrument:
    'Instrucciones SEM 1/2025 de la Secretaría de Estado de Migraciones sobre las autorizaciones de ' +
    'residencia temporal por circunstancias excepcionales por razón de arraigo previstas en el Reglamento ' +
    'de Extranjería aprobado por el Real Decreto 1155/2024, de 19 de noviembre',
  provision: 'Instrucción séptima',
  url: SEM_URL,
  jurisdiction: 'ES',
  verifiedOn: VERIFIED_ON,
  discretionary: true,
  note:
    'MINISTERIAL GUIDANCE, NOT REGULATION. The art. 127.e) case for a person supporting someone with a ' +
    'disability "se entenderá que sólo podrá aplicarse a un único familiar que cumpla con los requisitos ' +
    'dispuestos en el precepto" — only one relative may obtain the authorisation on that basis. Art. 127.e) ' +
    'does not say so itself.',
};

// ---------------------------------------------------------------------------
// Arraigo de segunda oportunidad — art. 127.a)
// ---------------------------------------------------------------------------

export const esArraigoSegundaOportunidad: Pathway = {
  id: 'es-arraigo-segunda-oportunidad',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  openedOn: RLOEX_IN_FORCE,
  name: {
    en: 'Arraigo de segunda oportunidad — second-chance rootedness',
    es: 'Arraigo de segunda oportunidad',
  },
  summary: {
    en:
      'One year of residence, with work authorisation, for a person who has been in Spain continuously for ' +
      'two years and who held an ordinary residence authorisation during those two years that was not ' +
      'renewed. Created by the 2025 Reglamento; it had no equivalent under Real Decreto 557/2011.',
    es:
      'Un año de residencia, con autorización de trabajo, para quien lleva dos años de permanencia ' +
      'continuada en España y fue titular en ese periodo de una autorización de residencia ordinaria que no ' +
      'se renovó. Es una figura creada por el Reglamento de 2025; no existía en el Real Decreto 557/2011.',
  },
  citations: [
    rloexArt125,
    rloexArt126,
    rloexArt127a,
    rloexArt130,
    rloexArt131,
    rloexArt132,
    rd316_2026,
    semPermanencia,
    semSegundaOportunidad,
    rd557Art124,
  ],
  criteria: [
    {
      id: 'es-arr-so-two-years-presence',
      kind: 'residence',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Two years of continuous presence in Spain immediately before the application',
        es: 'Dos años de permanencia continuada en España inmediatamente anteriores a la solicitud',
      },
      humanReviewReason: {
        en:
          'Arraigo turns on physical presence, which this engine does not hold. It records legal residence, ' +
          'and an applicant for arraigo is by definition someone whose presence is not on a residence ' +
          'register. A person must establish the two years from the evidence.',
        es:
          'El arraigo se acredita por permanencia física, dato que este motor no almacena: registra la ' +
          'residencia legal, y quien solicita arraigo es por definición alguien cuya permanencia no consta ' +
          'en un registro de residencia. Los dos años debe acreditarlos una persona a la vista de la prueba.',
      },
      guidance: {
        en:
          'Art. 126.b) requires presence "de forma continuada" and fixes no number of days. The ministry ' +
          'does: Instrucción primera.2 of the SEM instructions permits no more than 90 calendar days of ' +
          'absence across the two years. That is guidance, not regulation. Presence is proved in practice by ' +
          'padrón registration and any other evidence admissible in law. The absence figure shown alongside ' +
          'this criterion is every absence recorded for the applicant, not only those falling inside the ' +
          'two-year window — the engine does not slice the window, which is one of the reasons this ' +
          'criterion is not decided automatically. Time spent in Spain while an international-protection ' +
          'claim was pending does not count towards the two years.',
        es:
          'El art. 126.b) exige permanencia «de forma continuada» y no fija ningún número de días. El ' +
          'ministerio sí: la Instrucción primera.2 de las Instrucciones SEM no admite más de 90 días ' +
          'naturales de ausencia en los dos años. Eso es una instrucción, no el reglamento. En la práctica ' +
          'la permanencia se acredita con el empadronamiento y cualquier otro medio de prueba admitido en ' +
          'derecho. La cifra de ausencias que acompaña a este criterio recoge todas las ausencias ' +
          'registradas, no solo las comprendidas en la ventana de dos años: el motor no recorta la ventana, ' +
          'y esa es una de las razones por las que este criterio no se resuelve de forma automática. El ' +
          'tiempo de permanencia mientras se tramitaba una solicitud de protección internacional no computa.',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 90 },
    },
    {
      id: 'es-arr-so-prior-authorisation',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-127-a', 'es-arraigo-sem-1-2025-segunda-oportunidad'],
      label: {
        en: 'Held an ordinary residence authorisation in the two years before the application, not renewed',
        es: 'Titular de una autorización de residencia ordinaria en los dos años anteriores, no renovada',
      },
      humanReviewReason: {
        en:
          'The test is about which authorisation was held and why it was not renewed. This engine holds ' +
          'periods of legal residence but not the type of authorisation behind them nor the reason it lapsed.',
        es:
          'La prueba versa sobre qué autorización se ostentaba y por qué no se renovó. Este motor guarda ' +
          'periodos de residencia legal, pero no el tipo de autorización que los amparaba ni el motivo de su ' +
          'pérdida de vigencia.',
      },
      guidance: {
        en:
          'The earlier authorisation must have been an ordinary one — an authorisation granted on ' +
          'exceptional-circumstances grounds, arraigo included, does not open this route — and it must have ' +
          'been capable of renewal or prórroga. The route is available where the renewal could not be made ' +
          'because the filing window expired, or where it was refused for failure to meet its requirements. ' +
          'It is not available where the renewal failed for reasons of public order, security or public ' +
          'health, unless there is an acquittal, a dismissal or a decision denying the penalty, and it is not ' +
          'available where the earlier authorisation was extinguished on any ground other than the one in ' +
          'art. 200.1 of the Reglamento.',
        es:
          'La autorización anterior debía ser ordinaria —una autorización por circunstancias excepcionales, ' +
          'incluido el propio arraigo, no abre esta vía— y susceptible de renovación o prórroga. Cabe la vía ' +
          'cuando la renovación no pudo hacerse por haber expirado el plazo de solicitud, o cuando fue ' +
          'denegada por incumplimiento de sus requisitos. No cabe cuando la renovación no se produjo por ' +
          'razones de orden público, seguridad o salud pública, salvo sentencia absolutoria, sobreseimiento o ' +
          'sentencia denegatoria de la pena, ni cuando la autorización anterior se extinguió por una causa ' +
          'distinta de la del art. 200.1 del Reglamento.',
      },
      evaluator: { op: 'is_present', path: 'residencePeriods' },
    },
    {
      id: 'es-arr-so-not-protection-applicant',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Not an applicant for international protection when filing or while the application is processed',
        es: 'No tener la condición de solicitante de protección internacional al solicitar ni durante la tramitación',
      },
      guidance: {
        en:
          'Art. 126.a) treats a person as an applicant for international protection until there is a final ' +
          'decision on the claim, administrative and, where applicable, judicial. The SEM instructions add ' +
          'that the status is acquired from the moment the wish to claim is expressed, and that on ' +
          'withdrawing the claim the applicant satisfies this requirement from that moment and the two-year ' +
          'presence count starts or resumes. This engine reads only the status recorded for the applicant. ' +
          'Anyone with a live protection claim, or who may have grounds for one, should take that to a lawyer ' +
          'or a specialised organisation: the trade between a protection claim and a residence authorisation ' +
          'is not one to make from a checklist.',
        es:
          'El art. 126.a) considera solicitante de protección internacional a quien no tiene todavía ' +
          'resolución firme en sede administrativa y, en su caso, judicial. Las Instrucciones SEM añaden que ' +
          'esa condición se adquiere desde la manifestación de la voluntad de pedir protección y que, si se ' +
          'desiste de la solicitud, desde ese momento se cumple este requisito y comienza o se reanuda el ' +
          'cómputo de los dos años de permanencia. Este motor solo lee la situación registrada. Quien tenga ' +
          'una solicitud de protección viva, o pueda tener motivos para presentarla, debe acudir a un ' +
          'profesional del derecho o a una entidad especializada: la disyuntiva entre una solicitud de ' +
          'protección y una autorización de residencia no se resuelve con una lista de comprobación.',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'asylum_seeker' } },
    },
    {
      id: 'es-arr-so-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Not currently the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'Art. 126.h), added by RD 316/2026 with effect from 16 April 2026, also bars anyone who is an ' +
          'interested party in a pending procedure for the grant, extension, renewal or modification of a ' +
          'stay or residence authorisation. This engine holds no record of pending procedures, so that half ' +
          'of the requirement is not checked here — it has to be confirmed by a person. Note that the ' +
          'exclusion is new: an application made between 20 May 2025 and 15 April 2026 was not subject to it.',
        es:
          'El art. 126.h), añadido por el RD 316/2026 con efectos desde el 16 de abril de 2026, excluye ' +
          'también a quien sea persona interesada en un procedimiento pendiente de concesión, prórroga, ' +
          'renovación o modificación de autorizaciones de estancia o residencia. Este motor no guarda ' +
          'procedimientos en tramitación, de modo que esa mitad del requisito no se comprueba aquí y debe ' +
          'verificarla una persona. Conviene recordar que la exclusión es nueva: una solicitud presentada ' +
          'entre el 20 de mayo de 2025 y el 15 de abril de 2026 no estaba sujeta a ella.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-so-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'Art. 126.d) asks for the absence of a criminal record in Spain and in the countries where the ' +
          'applicant lived during the five years before *entering* Spain — which is not the same set as the ' +
          'country of nationality, and not the same window as the five years before filing. This criterion ' +
          'checks the country of nationality only. Two things follow from art. 130.2: the Spanish record and ' +
          'a police report are obtained by the oficina de extranjería of its own motion, so the applicant ' +
          'does not supply them; and no third-country certificate is needed at all where the applicant has ' +
          'been in Spain continuously for the five years immediately before filing. Art. 126.c) separately ' +
          'requires that the applicant not be a threat to public order, security or public health; that is a ' +
          'case-by-case assessment, an entry in the police report is not automatically a refusal, and it is ' +
          'not modelled here.',
        es:
          'El art. 126.d) exige carecer de antecedentes penales en España y en los países donde se haya ' +
          'residido durante los cinco años anteriores a la *entrada* en España, que no es el mismo conjunto ' +
          'que el país de nacionalidad ni la misma ventana que los cinco años previos a la solicitud. Este ' +
          'criterio comprueba únicamente el país de nacionalidad. Del art. 130.2 se siguen dos cosas: el ' +
          'certificado español y el informe policial los recaba de oficio la oficina de extranjería, de modo ' +
          'que no los aporta la persona solicitante; y no se exige certificado de terceros países cuando se ' +
          'ha permanecido en España de forma continuada los cinco años inmediatamente anteriores a la ' +
          'solicitud. El art. 126.c) exige además no representar una amenaza para el orden público, la ' +
          'seguridad o la salud pública: es una valoración caso por caso, la existencia de antecedentes en el ' +
          'informe policial no es causa automática de denegación, y no se modela aquí.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-so-predecessor-note',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-arraigo-rd-557-2011-art-124-derogado'],
      label: {
        en: 'Applications filed before 20 May 2025 are decided under the previous Reglamento',
        es: 'Las solicitudes presentadas antes del 20 de mayo de 2025 se resuelven conforme al Reglamento anterior',
      },
      guidance: {
        en:
          'RD 1155/2024 disposición transitoria segunda: an application lodged before the Reglamento entered ' +
          'into force is processed and decided under the law in force when it was filed, unless the applicant ' +
          'asks for the new Reglamento to be applied and meets its requirements. RD 557/2011 had no ' +
          'second-chance figure, so this route was not available then.',
        es:
          'Disposición transitoria segunda del RD 1155/2024: la solicitud presentada antes de la entrada en ' +
          'vigor del Reglamento se tramita y resuelve conforme a la normativa vigente en la fecha de su ' +
          'presentación, salvo que la persona interesada pida la aplicación del nuevo Reglamento y acredite ' +
          'sus requisitos. El RD 557/2011 no contemplaba la segunda oportunidad, por lo que esta vía no ' +
          'existía entonces.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: RLOEX_IN_FORCE },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    citationIds: ['es-arraigo-rloex-art-125', 'es-arraigo-rloex-art-132', 'es-arraigo-rloex-art-131'],
    note: {
      en:
        'One year, and each prórroga one year (arts. 125.2 and 132.1). The authorisation carries employed and ' +
        'self-employed work rights with no geographical or occupational limit (art. 131). A prórroga is ' +
        'conditional on active job-seeking and registration with the public employment service, unless ' +
        'justified circumstances such as illness, disability or having reached retirement age prevent access ' +
        'to work (art. 132.2.a), 2026 wording). Time held under an arraigo authorisation is legal residence in ' +
        'Spain; whether it counts towards naturalisation is governed by Código Civil art. 22.3, which this ' +
        'record does not restate — see the Spanish nationality pathways.',
      es:
        'Un año, y cada prórroga un año (arts. 125.2 y 132.1). La autorización lleva aparejada autorización ' +
        'de trabajo por cuenta ajena y propia sin limitación de ámbito geográfico ni ocupación (art. 131). La ' +
        'prórroga se condiciona a la búsqueda activa de empleo y a la inscripción en el servicio público de ' +
        'empleo, salvo que concurran circunstancias debidamente justificadas —enfermedad, discapacidad o edad ' +
        'legal de jubilación— que impidan el acceso al empleo (art. 132.2.a), redacción de 2026). El tiempo ' +
        'bajo una autorización de arraigo es residencia legal en España; que compute para la nacionalidad lo ' +
        'rige el art. 22.3 del Código Civil, que este registro no reproduce: véanse las vías de nacionalidad.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Arraigo sociolaboral — art. 127.b)
// ---------------------------------------------------------------------------

export const esArraigoSociolaboral: Pathway = {
  id: 'es-arraigo-sociolaboral',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  openedOn: RLOEX_IN_FORCE,
  name: {
    en: 'Arraigo sociolaboral — socio-labour rootedness',
    es: 'Arraigo sociolaboral',
  },
  summary: {
    en:
      'One year of residence and work for a person who has been in Spain continuously for two years and holds ' +
      'one or more employment contracts totalling at least twenty hours a week at the minimum wage or the ' +
      'applicable collective-agreement wage. This is the employment figure of the 2025 Reglamento; the ' +
      'previous *arraigo laboral*, which looked back at work already done, no longer exists.',
    es:
      'Un año de residencia y trabajo para quien lleva dos años de permanencia continuada en España y aporta ' +
      'uno o varios contratos de trabajo que sumen al menos veinte horas semanales con el salario mínimo ' +
      'interprofesional o el del convenio colectivo aplicable. Es la figura laboral del Reglamento de 2025; ' +
      'el anterior *arraigo laboral*, que miraba al trabajo ya realizado, ha desaparecido.',
  },
  citations: [
    rloexArt125,
    rloexArt126,
    rloexArt127b,
    rloexArt130,
    rloexArt131,
    rloexArt132,
    rd316_2026,
    semPermanencia,
    semContrato,
    rd557Art124,
  ],
  criteria: [
    {
      id: 'es-arr-sl-two-years-presence',
      kind: 'residence',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Two years of continuous presence in Spain immediately before the application',
        es: 'Dos años de permanencia continuada en España inmediatamente anteriores a la solicitud',
      },
      humanReviewReason: {
        en:
          'Arraigo turns on physical presence, which this engine does not hold. It records legal residence, ' +
          'and an applicant for arraigo is by definition someone whose presence is not on a residence ' +
          'register. A person must establish the two years from the evidence.',
        es:
          'El arraigo se acredita por permanencia física, dato que este motor no almacena: registra la ' +
          'residencia legal, y quien solicita arraigo es por definición alguien cuya permanencia no consta ' +
          'en un registro de residencia. Los dos años debe acreditarlos una persona a la vista de la prueba.',
      },
      guidance: {
        en:
          'Art. 126.b) requires presence "de forma continuada" and fixes no number of days; Instrucción ' +
          'primera.2 of the SEM instructions permits no more than 90 calendar days of absence across the two ' +
          'years, which is guidance rather than regulation. Presence is proved in practice by padrón ' +
          'registration and any other evidence admissible in law. The absence figure shown alongside this ' +
          'criterion is every absence recorded for the applicant, not only those inside the two-year window.',
        es:
          'El art. 126.b) exige permanencia «de forma continuada» y no fija número de días; la Instrucción ' +
          'primera.2 de las Instrucciones SEM no admite más de 90 días naturales de ausencia en los dos años, ' +
          'y eso es una instrucción, no el reglamento. En la práctica la permanencia se acredita con el ' +
          'empadronamiento y cualquier otro medio de prueba admitido en derecho. La cifra de ausencias que ' +
          'acompaña a este criterio recoge todas las registradas, no solo las de la ventana de dos años.',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 90 },
    },
    {
      id: 'es-arr-sl-employment-contract',
      kind: 'employment',
      weight: 'blocking',
      citationIds: [
        'es-arraigo-rloex-art-127-b',
        'es-arraigo-rloex-art-130',
        'es-arraigo-sem-1-2025-contrato',
      ],
      label: {
        en: 'A signed contract of employment, not self-employment',
        es: 'Contrato de trabajo firmado, no actividad por cuenta propia',
      },
      guidance: {
        en:
          'Art. 130.1.b) asks for the contract signed by worker and employer. Art. 127.b) speaks of ' +
          '"contratos de trabajo", and Instrucción tercera.5 states expressly that self-employment does not ' +
          'open this route — that exclusion is the ministry’s, not the regulation’s. More than one contract ' +
          'is admitted for seasonal work and for simultaneous part-time work with more than one employer. ' +
          'The employer must meet art. 74 except art. 74.1.a); read by Instrucción tercera.4 as being up to ' +
          'date with tax and Social Security obligations and having means sufficient for the business and for ' +
          'the obligations owed to the worker. Those employer obligations are not assessed here.',
        es:
          'El art. 130.1.b) exige el contrato firmado por la persona trabajadora y el empleador. El art. ' +
          '127.b) habla de «contratos de trabajo», y la Instrucción tercera.5 declara expresamente que la ' +
          'actividad por cuenta propia no abre esta vía: esa exclusión es del ministerio, no del reglamento. ' +
          'Cabe más de un contrato en trabajos estacionales y en el trabajo parcial simultáneo para varios ' +
          'empleadores. El empleador debe cumplir el art. 74 salvo su apartado 1.a); la Instrucción tercera.4 ' +
          'lo lee como estar al corriente de las obligaciones tributarias y con la Seguridad Social y contar ' +
          'con medios suficientes para el proyecto empresarial y para las obligaciones asumidas frente a la ' +
          'persona trabajadora. Esas obligaciones del empleador no se valoran aquí.',
      },
      evaluator: {
        op: 'all_of',
        of: [
          { op: 'is_true', path: 'jobOffer.writtenOffer' },
          { op: 'is_false', path: 'jobOffer.selfEmployment' },
        ],
      },
    },
    {
      id: 'es-arr-sl-weekly-hours',
      kind: 'employment',
      weight: 'material',
      citationIds: ['es-arraigo-rloex-art-127-b', 'es-arraigo-sem-1-2025-contrato'],
      label: {
        en: 'The contract, or contracts together, represent at least twenty hours a week',
        es: 'El contrato, o la suma de contratos, representa al menos veinte horas semanales',
      },
      humanReviewWhen: { op: 'is_false', path: 'jobOffer.fullTime' },
      humanReviewReason: {
        en:
          'The engine records whether the post is full-time, not its weekly hours. A part-time post may well ' +
          'meet the twenty-hour threshold, so it is routed to a person instead of being marked unmet.',
        es:
          'El motor registra si el puesto es a jornada completa, no las horas semanales. Un puesto a tiempo ' +
          'parcial puede perfectamente alcanzar las veinte horas, por lo que se remite a una persona en ' +
          'lugar de darse por incumplido.',
      },
      guidance: {
        en:
          'Art. 127.b) sets "una jornada semanal no inferior a veinte horas en cómputo global", counted ' +
          'across all the contracts supplied, and Instrucción tercera.1 allows the aggregate to be calculated ' +
          'over the whole length of the contract. Twenty hours is the threshold for everyone: RD 557/2011 ' +
          'required thirty for arraigo social, and twenty only where the applicant had dependants. Do not ' +
          'carry the thirty-hour figure forward.',
        es:
          'El art. 127.b) fija «una jornada semanal no inferior a veinte horas en cómputo global», sumando ' +
          'todos los contratos aportados, y la Instrucción tercera.1 permite calcular ese cómputo sobre la ' +
          'duración total del contrato. Las veinte horas rigen para todos: el RD 557/2011 exigía treinta ' +
          'para el arraigo social, y veinte solo con menores o personas a cargo. No arrastre la cifra de ' +
          'treinta horas.',
      },
      evaluator: { op: 'is_true', path: 'jobOffer.fullTime' },
    },
    {
      id: 'es-arr-sl-wage',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-arraigo-rloex-art-127-b'],
      label: {
        en: 'Pay of at least the minimum wage, or the collective-agreement wage, in proportion to the hours',
        es: 'Retribución de al menos el salario mínimo interprofesional, o el del convenio, en proporción a la jornada',
      },
      humanReviewWhen: { op: 'lt', path: 'derived.jobOfferSalarySmiMultiple', value: 1 },
      humanReviewReason: {
        en:
          'The comparison is annual salary against the annual SMI supplied with the facts, so a part-time ' +
          'contract paid proportionally falls below the multiple even though it complies. A person has to ' +
          'compare the wage against the hours, and against the collective agreement where one applies.',
        es:
          'La comparación se hace entre el salario anual y el SMI anual aportado con los datos, de modo que ' +
          'un contrato a tiempo parcial retribuido proporcionalmente queda por debajo del múltiplo aunque ' +
          'cumpla. Debe ser una persona quien contraste la retribución con la jornada y, en su caso, con el ' +
          'convenio colectivo aplicable.',
      },
      guidance: {
        en:
          'Art. 127.b) requires at least the salario mínimo interprofesional or the wage set by the ' +
          'applicable collective agreement at the time of the application, in proportion to the hours worked. ' +
          'The SMI is re-set annually by decree, so the rule is encoded as a multiple and the current figure ' +
          'has to be supplied with the applicant’s facts; without it this criterion reports "unknown" rather ' +
          'than measuring against a stale number.',
        es:
          'El art. 127.b) exige al menos el salario mínimo interprofesional o el salario del convenio ' +
          'colectivo aplicable en el momento de la solicitud, en proporción a la jornada trabajada. El SMI se ' +
          'fija cada año por real decreto, por lo que la regla se codifica como múltiplo y la cifra vigente ' +
          'debe aportarse junto con los datos; sin ella este criterio responde «desconocido» en lugar de ' +
          'medir contra una cifra caducada.',
      },
      evaluator: { op: 'gte', path: 'derived.jobOfferSalarySmiMultiple', value: 1 },
    },
    {
      id: 'es-arr-sl-fixed-term-length',
      kind: 'employment',
      weight: 'informational',
      citationIds: ['es-arraigo-sem-1-2025-contrato'],
      label: {
        en: 'A fixed-term contract, or the sum of them, must exceed ninety days',
        es: 'El contrato de duración determinada, o la suma de ellos, debe superar los noventa días',
      },
      guidance: {
        en:
          'This figure is Instrucción tercera.2 of the SEM instructions, not art. 127.b), which sets no ' +
          'minimum length. It bites only on fixed-term contracts: an indefinite contract records no duration ' +
          'and leaves this criterion undecided. The engine holds the length in months and the instruction is ' +
          'in days, so a contract of about three months has to be checked against its actual dates. This ' +
          'criterion is informational and never affects the verdict.',
        es:
          'La cifra procede de la Instrucción tercera.2 de las Instrucciones SEM, no del art. 127.b), que no ' +
          'fija duración mínima. Solo afecta a los contratos de duración determinada: un contrato indefinido ' +
          'no registra duración y deja este criterio sin decidir. El motor guarda la duración en meses y la ' +
          'instrucción se expresa en días, de modo que un contrato de unos tres meses debe comprobarse con ' +
          'sus fechas reales. Este criterio es informativo y nunca altera el resultado.',
      },
      evaluator: { op: 'gt', path: 'jobOffer.durationMonths', value: 3 },
    },
    {
      id: 'es-arr-sl-not-protection-applicant',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Not an applicant for international protection when filing or while the application is processed',
        es: 'No tener la condición de solicitante de protección internacional al solicitar ni durante la tramitación',
      },
      guidance: {
        en:
          'Art. 126.a). A person counts as an applicant until there is a final decision on the protection ' +
          'claim, and time in Spain while the claim was pending does not count towards the two years. Anyone ' +
          'with a live protection claim, or who may have grounds for one, should take that to a lawyer or a ' +
          'specialised organisation rather than to this engine.',
        es:
          'Art. 126.a). Se es solicitante hasta que exista resolución firme sobre la protección, y el tiempo ' +
          'de permanencia mientras se tramitaba no computa para los dos años. Quien tenga una solicitud de ' +
          'protección viva, o motivos para presentarla, debe acudir a un profesional del derecho o a una ' +
          'entidad especializada, no a este motor.',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'asylum_seeker' } },
    },
    {
      id: 'es-arr-sl-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Not currently the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'Art. 126.h), added by RD 316/2026 with effect from 16 April 2026, also bars anyone who is an ' +
          'interested party in a pending procedure for the grant, extension, renewal or modification of a ' +
          'stay or residence authorisation. This engine holds no record of pending procedures, so that half ' +
          'of the requirement is not checked here.',
        es:
          'El art. 126.h), añadido por el RD 316/2026 con efectos desde el 16 de abril de 2026, excluye ' +
          'también a quien sea persona interesada en un procedimiento pendiente de concesión, prórroga, ' +
          'renovación o modificación de autorizaciones de estancia o residencia. Este motor no guarda ' +
          'procedimientos en tramitación, por lo que esa mitad del requisito no se comprueba aquí.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-sl-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'Art. 126.d) covers Spain and the countries of residence during the five years before *entering* ' +
          'Spain; this criterion checks the country of nationality only. Under art. 130.2 the Spanish record ' +
          'and the police report are obtained by the oficina de extranjería of its own motion, and no ' +
          'third-country certificate is needed where the applicant has been in Spain continuously for the ' +
          'five years immediately before filing.',
        es:
          'El art. 126.d) abarca España y los países de residencia en los cinco años anteriores a la ' +
          '*entrada* en España; este criterio comprueba únicamente el país de nacionalidad. Conforme al art. ' +
          '130.2, el certificado español y el informe policial los recaba de oficio la oficina de ' +
          'extranjería, y no se exige certificado de terceros países cuando se ha permanecido en España de ' +
          'forma continuada los cinco años inmediatamente anteriores a la solicitud.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-sl-predecessor-note',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-arraigo-rd-557-2011-art-124-derogado'],
      label: {
        en: 'Applications filed before 20 May 2025 are decided under the previous Reglamento',
        es: 'Las solicitudes presentadas antes del 20 de mayo de 2025 se resuelven conforme al Reglamento anterior',
      },
      guidance: {
        en:
          'RD 1155/2024 disposición transitoria segunda applies old law by default and new law at the ' +
          'applicant’s election. Under RD 557/2011 the employment figures were *arraigo laboral*, which ' +
          'required employment relationships of not less than six months already performed, and *arraigo ' +
          'social*, which required three years’ presence and a contract of thirty hours a week. Neither ' +
          'survives in that form.',
        es:
          'La disposición transitoria segunda del RD 1155/2024 aplica por defecto la normativa anterior y la ' +
          'nueva a elección de la persona interesada. En el RD 557/2011 las figuras laborales eran el ' +
          '*arraigo laboral*, que exigía relaciones laborales de al menos seis meses ya realizadas, y el ' +
          '*arraigo social*, que exigía tres años de permanencia y un contrato de treinta horas semanales. ' +
          'Ninguna subsiste con esa forma.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: RLOEX_IN_FORCE },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    citationIds: [
      'es-arraigo-rloex-art-125',
      'es-arraigo-rloex-art-130',
      'es-arraigo-rloex-art-131',
      'es-arraigo-rloex-art-132',
    ],
    note: {
      en:
        'One year, and each prórroga one year (arts. 125.2 and 132.1), with employed and self-employed work ' +
        'rights and no geographical or occupational limit (art. 131). Art. 130.5, in the wording given by RD ' +
        '316/2026, provisionally authorises the applicant to reside and work as an employee from the moment ' +
        'the application is admitted until it is decided. A prórroga is conditional on active job-seeking and ' +
        'registration with the public employment service, unless justified circumstances prevent access to ' +
        'work (art. 132.2.a)).',
      es:
        'Un año, y cada prórroga un año (arts. 125.2 y 132.1), con autorización de trabajo por cuenta ajena y ' +
        'propia sin límite geográfico ni de ocupación (art. 131). El art. 130.5, en la redacción dada por el ' +
        'RD 316/2026, habilita provisionalmente a residir y trabajar por cuenta ajena desde la admisión a ' +
        'trámite de la solicitud y hasta su resolución. La prórroga se condiciona a la búsqueda activa de ' +
        'empleo y a la inscripción en el servicio público de empleo, salvo circunstancias debidamente ' +
        'justificadas que impidan el acceso al empleo (art. 132.2.a)).',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Arraigo social — art. 127.c)
// ---------------------------------------------------------------------------

export const esArraigoSocial: Pathway = {
  id: 'es-arraigo-social',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  openedOn: RLOEX_IN_FORCE,
  name: {
    en: 'Arraigo social — social rootedness',
    es: 'Arraigo social',
  },
  summary: {
    en:
      'One year of residence, with work authorisation, for a person who has been in Spain continuously for ' +
      'two years, has means of at least 100% of the IPREM, and either has close family ties to a foreign ' +
      'national holding a residence authorisation or obtains a favourable social-integration report from the ' +
      'Comunidad Autónoma. The qualifying period was three years under Real Decreto 557/2011; since 20 May ' +
      '2025 it is two, and the employment contract that route required has moved to *arraigo sociolaboral*.',
    es:
      'Un año de residencia, con autorización de trabajo, para quien lleva dos años de permanencia continuada ' +
      'en España, dispone de medios de al menos el 100 % del IPREM y acredita vínculos familiares con una ' +
      'persona extranjera titular de una autorización de residencia o, en su defecto, un informe favorable de ' +
      'integración social de la Comunidad Autónoma. Con el Real Decreto 557/2011 el plazo era de tres años; ' +
      'desde el 20 de mayo de 2025 es de dos, y el contrato de trabajo que aquella vía exigía ha pasado al ' +
      '*arraigo sociolaboral*.',
  },
  citations: [
    rloexArt125,
    rloexArt126,
    rloexArt127c,
    rloexArt130,
    rloexArt131,
    rloexArt132,
    rd316_2026,
    semPermanencia,
    semMedios,
    rd557Art124,
  ],
  criteria: [
    {
      id: 'es-arr-soc-two-years-presence',
      kind: 'residence',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Two years of continuous presence in Spain immediately before the application',
        es: 'Dos años de permanencia continuada en España inmediatamente anteriores a la solicitud',
      },
      humanReviewReason: {
        en:
          'Arraigo turns on physical presence, which this engine does not hold. It records legal residence, ' +
          'and an applicant for arraigo is by definition someone whose presence is not on a residence ' +
          'register. A person must establish the two years from the evidence.',
        es:
          'El arraigo se acredita por permanencia física, dato que este motor no almacena: registra la ' +
          'residencia legal, y quien solicita arraigo es por definición alguien cuya permanencia no consta ' +
          'en un registro de residencia. Los dos años debe acreditarlos una persona a la vista de la prueba.',
      },
      guidance: {
        en:
          'Two years, not three. The reduction from the three years RD 557/2011 required is the single ' +
          'change most likely to be got wrong from memory. Art. 126.b) fixes no number of permitted days of ' +
          'absence; Instrucción primera.2 of the SEM instructions permits no more than 90 calendar days ' +
          'across the two years, and that is ministerial guidance rather than regulation. The absence figure ' +
          'shown alongside this criterion is every absence recorded for the applicant, not only those inside ' +
          'the two-year window.',
        es:
          'Dos años, no tres. La reducción respecto de los tres años que exigía el RD 557/2011 es el cambio ' +
          'que más se yerra de memoria. El art. 126.b) no fija número de días de ausencia admisibles; la ' +
          'Instrucción primera.2 de las Instrucciones SEM no admite más de 90 días naturales en los dos años, ' +
          'y eso es una instrucción ministerial, no el reglamento. La cifra de ausencias que acompaña a este ' +
          'criterio recoge todas las registradas, no solo las de la ventana de dos años.',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 90 },
    },
    {
      id: 'es-arr-soc-ties-or-integration-report',
      kind: 'integration',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-127-c', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Family ties to a resident foreign national, or a favourable social-integration report',
        es: 'Vínculos familiares con persona extranjera residente o informe favorable de integración social',
      },
      humanReviewReason: {
        en:
          'Neither limb can be decided from the facts this engine holds. It records no family relationships, ' +
          'and the integration limb is decided by a Comunidad Autónoma issuing a report on evidence that ' +
          'never reaches this engine. The regulation says the integration effort "se valorará" and requires ' +
          'the report to be favourable, so this is an administrative judgement rather than a threshold.',
        es:
          'Ninguna de las dos vías puede resolverse con los datos que maneja este motor: no registra ' +
          'relaciones familiares, y la vía de integración la decide una Comunidad Autónoma mediante un ' +
          'informe emitido sobre pruebas que nunca llegan aquí. El reglamento dice que el esfuerzo de ' +
          'integración «se valorará» y exige que el informe sea favorable: es una valoración administrativa, ' +
          'no un umbral.',
      },
      guidance: {
        en:
          'Route one: family ties to another foreign national who holds a residence authorisation, limited to ' +
          'a spouse or registered partner and first-degree relatives in the direct line. Route two, where ' +
          'those ties are not shown: a favourable social-integration report from the competent bodies of the ' +
          'Comunidad Autónoma of the applicant’s place of residence, or from the Corporación local of their ' +
          'habitual address where the Comunidad Autónoma has so provided and has notified the Secretaría de ' +
          'Estado de Migraciones. The report is due within one month of being requested; where it is not ' +
          'issued in time and the applicant proves that, the requirement may be met by any means of proof ' +
          'admissible in law. In the wording given by RD 316/2026 the report records time at the habitual ' +
          'address, the means available and integration efforts through socio-labour and cultural insertion ' +
          'programmes; the 2025 wording had instead required it to certify knowledge and respect of ' +
          'constitutional values and, where applicable, the learning of the official languages. The 2011 ' +
          'version of this document was known as the *informe de arraigo*.',
        es:
          'Primera vía: vínculos familiares con otra persona extranjera titular de una autorización de ' +
          'residencia, limitados al cónyuge o pareja registrada y a los familiares en primer grado en línea ' +
          'directa. Segunda vía, si no se acreditan esos vínculos: informe favorable de integración social de ' +
          'los órganos competentes de la Comunidad Autónoma del lugar de residencia, o de la Corporación ' +
          'local del domicilio habitual cuando así lo haya establecido la Comunidad Autónoma y lo haya ' +
          'comunicado a la Secretaría de Estado de Migraciones. El informe debe emitirse en el plazo de un ' +
          'mes desde su solicitud; si no se emite en plazo y la persona interesada lo acredita, el requisito ' +
          'puede justificarse por cualquier medio de prueba. En la redacción del RD 316/2026 el informe hace ' +
          'constar el tiempo de permanencia en el domicilio habitual, los medios económicos y los esfuerzos ' +
          'de integración mediante programas de inserción sociolaboral y cultural; la redacción de 2025 ' +
          'exigía en cambio certificar el conocimiento y respeto de los valores constitucionales y, en su ' +
          'caso, el aprendizaje de las lenguas oficiales. En 2011 este documento se llamaba *informe de ' +
          'arraigo*.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-soc-means',
      kind: 'economic',
      weight: 'material',
      citationIds: ['es-arraigo-rloex-art-127-c', 'es-arraigo-sem-1-2025-medios'],
      label: {
        en: 'Means of at least 100% of the IPREM, available in Spain',
        es: 'Medios económicos de al menos el 100 % del IPREM, disponibles en España',
      },
      guidance: {
        en:
          'Art. 127.c) sets 100% of the IPREM. On the family-ties route the SEM instructions read that as ' +
          '200% in total — 100% for the resident relative and 100% for the applicant, whatever the size of ' +
          'the household — which is the ministry’s reading rather than the regulation’s text. The means must ' +
          'be available in Spain, may come from the qualifying relatives (the 2026 wording says "podrán ' +
          'proceder"; the 2025 wording said "procederán"), and may be drawn from self-employment where art. ' +
          '84 is satisfied. This engine measures only income recorded as the applicant’s own income not ' +
          'derived from work, against the IPREM supplied with the facts, so a person relying on a relative’s ' +
          'income will not satisfy this check even though the rule allows it. IPREM is re-set annually, so ' +
          'the current figure must be supplied; without it the criterion reports "unknown".',
        es:
          'El art. 127.c) fija el 100 % del IPREM. En la vía de vínculos familiares las Instrucciones SEM lo ' +
          'leen como un 200 % en total —100 % por el familiar residente y 100 % por la persona solicitante, ' +
          'con independencia de los miembros de la unidad de convivencia—, lectura del ministerio y no texto ' +
          'del reglamento. Los medios deben estar disponibles en España, pueden proceder de los familiares ' +
          'mencionados (la redacción de 2026 dice «podrán proceder»; la de 2025 decía «procederán») y pueden ' +
          'provenir de una actividad por cuenta propia si se cumple el art. 84. Este motor solo mide los ' +
          'ingresos registrados como propios y no derivados del trabajo, frente al IPREM aportado con los ' +
          'datos, de modo que quien se apoye en los ingresos de un familiar no superará esta comprobación ' +
          'aunque la norma lo permita. El IPREM se actualiza cada año: sin la cifra vigente el criterio ' +
          'responde «desconocido».',
      },
      evaluator: { op: 'gte', path: 'derived.passiveIncomeIpremMultiple', value: 1 },
    },
    {
      id: 'es-arr-soc-not-protection-applicant',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Not an applicant for international protection when filing or while the application is processed',
        es: 'No tener la condición de solicitante de protección internacional al solicitar ni durante la tramitación',
      },
      guidance: {
        en:
          'Art. 126.a). A person counts as an applicant until there is a final decision on the protection ' +
          'claim, and time in Spain while the claim was pending does not count towards the two years. Anyone ' +
          'with a live protection claim, or who may have grounds for one, should take that to a lawyer or a ' +
          'specialised organisation rather than to this engine.',
        es:
          'Art. 126.a). Se es solicitante hasta que exista resolución firme sobre la protección, y el tiempo ' +
          'de permanencia mientras se tramitaba no computa para los dos años. Quien tenga una solicitud de ' +
          'protección viva, o motivos para presentarla, debe acudir a un profesional del derecho o a una ' +
          'entidad especializada, no a este motor.',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'asylum_seeker' } },
    },
    {
      id: 'es-arr-soc-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Not currently the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'Art. 126.h), added by RD 316/2026 with effect from 16 April 2026, also bars anyone who is an ' +
          'interested party in a pending procedure for the grant, extension, renewal or modification of a ' +
          'stay or residence authorisation. This engine holds no record of pending procedures, so that half ' +
          'of the requirement is not checked here.',
        es:
          'El art. 126.h), añadido por el RD 316/2026 con efectos desde el 16 de abril de 2026, excluye ' +
          'también a quien sea persona interesada en un procedimiento pendiente de concesión, prórroga, ' +
          'renovación o modificación de autorizaciones de estancia o residencia. Este motor no guarda ' +
          'procedimientos en tramitación, por lo que esa mitad del requisito no se comprueba aquí.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-soc-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'Art. 126.d) covers Spain and the countries of residence during the five years before *entering* ' +
          'Spain; this criterion checks the country of nationality only. Under art. 130.2 the Spanish record ' +
          'and the police report are obtained by the oficina de extranjería of its own motion, and no ' +
          'third-country certificate is needed where the applicant has been in Spain continuously for the ' +
          'five years immediately before filing.',
        es:
          'El art. 126.d) abarca España y los países de residencia en los cinco años anteriores a la ' +
          '*entrada* en España; este criterio comprueba únicamente el país de nacionalidad. Conforme al art. ' +
          '130.2, el certificado español y el informe policial los recaba de oficio la oficina de ' +
          'extranjería, y no se exige certificado de terceros países cuando se ha permanecido en España de ' +
          'forma continuada los cinco años inmediatamente anteriores a la solicitud.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-soc-predecessor-note',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-arraigo-rd-557-2011-art-124-derogado'],
      label: {
        en: 'Applications filed before 20 May 2025 are decided under the previous Reglamento',
        es: 'Las solicitudes presentadas antes del 20 de mayo de 2025 se resuelven conforme al Reglamento anterior',
      },
      guidance: {
        en:
          'RD 1155/2024 disposición transitoria segunda applies old law by default and new law at the ' +
          'applicant’s election. Under RD 557/2011 art. 124.2 arraigo social required three years’ presence, ' +
          'a contract of at least thirty hours a week — twenty where the applicant had dependants — and ' +
          'either family ties to resident foreign nationals or an *informe de arraigo* from the Comunidad ' +
          'Autónoma. An application still governed by that text is measured against those requirements, not ' +
          'against the ones above.',
        es:
          'La disposición transitoria segunda del RD 1155/2024 aplica por defecto la normativa anterior y la ' +
          'nueva a elección de la persona interesada. Conforme al art. 124.2 del RD 557/2011, el arraigo ' +
          'social exigía tres años de permanencia, un contrato de al menos treinta horas semanales —veinte ' +
          'con menores o personas a cargo— y vínculos familiares con extranjeros residentes o un *informe de ' +
          'arraigo* de la Comunidad Autónoma. Una solicitud aún regida por ese texto se mide con aquellos ' +
          'requisitos, no con los anteriores.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: RLOEX_IN_FORCE },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    citationIds: ['es-arraigo-rloex-art-125', 'es-arraigo-rloex-art-131', 'es-arraigo-rloex-art-132'],
    note: {
      en:
        'One year, and each prórroga one year (arts. 125.2 and 132.1), with employed and self-employed work ' +
        'rights and no geographical or occupational limit (art. 131). A prórroga is conditional on active ' +
        'job-seeking and registration with the public employment service, unless justified circumstances such ' +
        'as illness, disability or having reached retirement age prevent access to work (art. 132.2.a), 2026 ' +
        'wording).',
      es:
        'Un año, y cada prórroga un año (arts. 125.2 y 132.1), con autorización de trabajo por cuenta ajena y ' +
        'propia sin límite geográfico ni de ocupación (art. 131). La prórroga se condiciona a la búsqueda ' +
        'activa de empleo y a la inscripción en el servicio público de empleo, salvo circunstancias ' +
        'debidamente justificadas —enfermedad, discapacidad o edad legal de jubilación— que impidan el acceso ' +
        'al empleo (art. 132.2.a), redacción de 2026).',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Arraigo socioformativo — art. 127.d)
// ---------------------------------------------------------------------------

export const esArraigoSocioformativo: Pathway = {
  id: 'es-arraigo-socioformativo',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  openedOn: RLOEX_IN_FORCE,
  name: {
    en: 'Arraigo socioformativo — socio-educational rootedness',
    es: 'Arraigo socioformativo',
  },
  summary: {
    en:
      'One year of residence for a person who has been in Spain continuously for two years and is enrolled ' +
      'in, or undertaking, one of the trainings the Reglamento names, backed by a social-integration report. ' +
      'Work as an employee is capped at thirty hours a week. Called *arraigo para la formación* under Real ' +
      'Decreto 557/2011.',
    es:
      'Un año de residencia para quien lleva dos años de permanencia continuada en España y está matriculado ' +
      'o cursando alguna de las formaciones que enumera el Reglamento, con un informe de integración social. ' +
      'El trabajo por cuenta ajena se limita a treinta horas semanales. En el Real Decreto 557/2011 se ' +
      'llamaba *arraigo para la formación*.',
  },
  citations: [
    rloexArt125,
    rloexArt126,
    rloexArt127c,
    rloexArt127d,
    rloexArt130,
    rloexArt131,
    rloexArt132,
    rd316_2026,
    semPermanencia,
    rd557Art124,
  ],
  criteria: [
    {
      id: 'es-arr-sf-two-years-presence',
      kind: 'residence',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Two years of continuous presence in Spain immediately before the application',
        es: 'Dos años de permanencia continuada en España inmediatamente anteriores a la solicitud',
      },
      humanReviewReason: {
        en:
          'Arraigo turns on physical presence, which this engine does not hold. It records legal residence, ' +
          'and an applicant for arraigo is by definition someone whose presence is not on a residence ' +
          'register. A person must establish the two years from the evidence.',
        es:
          'El arraigo se acredita por permanencia física, dato que este motor no almacena: registra la ' +
          'residencia legal, y quien solicita arraigo es por definición alguien cuya permanencia no consta ' +
          'en un registro de residencia. Los dos años debe acreditarlos una persona a la vista de la prueba.',
      },
      guidance: {
        en:
          'Art. 126.b) fixes no number of permitted days of absence; Instrucción primera.2 of the SEM ' +
          'instructions permits no more than 90 calendar days across the two years, which is ministerial ' +
          'guidance rather than regulation. The absence figure shown alongside this criterion is every ' +
          'absence recorded for the applicant, not only those inside the two-year window.',
        es:
          'El art. 126.b) no fija número de días de ausencia admisibles; la Instrucción primera.2 de las ' +
          'Instrucciones SEM no admite más de 90 días naturales en los dos años, lo que es una instrucción ' +
          'ministerial y no el reglamento. La cifra de ausencias que acompaña a este criterio recoge todas ' +
          'las registradas, no solo las de la ventana de dos años.',
      },
      evaluator: { op: 'lte', path: 'derived.absenceDaysTotal', value: 90 },
    },
    {
      id: 'es-arr-sf-training-enrolment',
      kind: 'qualification',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-127-d'],
      label: {
        en: 'Enrolled in, or undertaking, one of the trainings the Reglamento names',
        es: 'Estar matriculado o cursando alguna de las formaciones que enumera el Reglamento',
      },
      humanReviewReason: {
        en:
          'This engine records qualifications already held, not current enrolment, and it holds no list of ' +
          'which Spanish training programmes fall inside arts. 52.1.b) and 52.1.e).5.º. A person has to match ' +
          'the specific course against those provisions.',
        es:
          'Este motor registra titulaciones ya obtenidas, no la matrícula en curso, y no guarda qué ' +
          'formaciones españolas quedan dentro de los arts. 52.1.b) y 52.1.e).5.º. Debe ser una persona ' +
          'quien contraste el curso concreto con esos preceptos.',
      },
      guidance: {
        en:
          'The admissible trainings are those in arts. 52.1.b) and 52.1.e).5.º of the Reglamento — level one ' +
          'included — and the in-person offer of compulsory adult education. The alternative limb is a ' +
          'commitment to training promoted by the public employment services aimed at occupations in the ' +
          'catalogue referred to in art. 75.1. Two deadlines matter and both are unforgiving: where enrolment ' +
          'has an official window, the application must be filed in the two months *before* that window ' +
          'opens; and proof of enrolment must reach the oficina de extranjería within three months of ' +
          'notification of the grant, failing which the authorisation is extinguished. Failure to prove that ' +
          'the employment-services training was actually done extinguishes it too.',
        es:
          'Las formaciones admisibles son las de los arts. 52.1.b) y 52.1.e).5.º del Reglamento —incluido el ' +
          'nivel uno— y la oferta presencial de las enseñanzas obligatorias de la educación de personas ' +
          'adultas. La vía alternativa es comprometerse a una formación promovida por los Servicios Públicos ' +
          'de Empleo orientada a ocupaciones del catálogo del art. 75.1. Dos plazos son decisivos y no ' +
          'perdonan: si la matrícula tiene plazo oficial, la solicitud debe presentarse en los dos meses ' +
          '*anteriores* a su apertura; y la prueba de la matriculación debe llegar a la oficina de ' +
          'extranjería en tres meses desde la notificación de la concesión, so pena de extinción de la ' +
          'autorización. La falta de acreditación de la formación promovida por los Servicios Públicos de ' +
          'Empleo la extingue igualmente.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-sf-integration-report',
      kind: 'integration',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-127-d', 'es-arraigo-rloex-art-127-c'],
      label: {
        en: 'Social-integration report on the terms of art. 127.c)',
        es: 'Informe de integración social en los términos del art. 127.c)',
      },
      humanReviewReason: {
        en:
          'The report is issued by a Comunidad Autónoma — or by the Corporación local where the Comunidad ' +
          'Autónoma has so provided — on evidence that never reaches this engine, and the regulation requires ' +
          'it to be favourable. That is an administrative judgement, not a threshold software can apply.',
        es:
          'El informe lo emite una Comunidad Autónoma —o la Corporación local cuando aquélla así lo haya ' +
          'establecido— sobre pruebas que nunca llegan a este motor, y el reglamento exige que sea ' +
          'favorable. Es una valoración administrativa, no un umbral que pueda aplicar un programa.',
      },
      guidance: {
        en:
          'Art. 127.d) requires the report "en los términos previstos en el apartado c) de este artículo", so ' +
          'the arraigo social machinery applies: a one-month issuing deadline, and, where the report is not ' +
          'issued in time and the applicant proves that, proof of the requirement by any means admissible in ' +
          'law. In the wording given by RD 316/2026 the report records time at the habitual address, the ' +
          'means available and integration efforts through socio-labour and cultural insertion programmes.',
        es:
          'El art. 127.d) exige el informe «en los términos previstos en el apartado c) de este artículo», de ' +
          'modo que se aplica el mecanismo del arraigo social: plazo de emisión de un mes y, si no se emite ' +
          'en plazo y la persona interesada lo acredita, justificación del requisito por cualquier medio de ' +
          'prueba admitido en derecho. En la redacción del RD 316/2026 el informe hace constar el tiempo de ' +
          'permanencia en el domicilio habitual, los medios económicos y los esfuerzos de integración ' +
          'mediante programas de inserción sociolaboral y cultural.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-sf-not-protection-applicant',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-sem-1-2025-permanencia'],
      label: {
        en: 'Not an applicant for international protection when filing or while the application is processed',
        es: 'No tener la condición de solicitante de protección internacional al solicitar ni durante la tramitación',
      },
      guidance: {
        en:
          'Art. 126.a). A person counts as an applicant until there is a final decision on the protection ' +
          'claim, and time in Spain while the claim was pending does not count towards the two years. Anyone ' +
          'with a live protection claim, or who may have grounds for one, should take that to a lawyer or a ' +
          'specialised organisation rather than to this engine.',
        es:
          'Art. 126.a). Se es solicitante hasta que exista resolución firme sobre la protección, y el tiempo ' +
          'de permanencia mientras se tramitaba no computa para los dos años. Quien tenga una solicitud de ' +
          'protección viva, o motivos para presentarla, debe acudir a un profesional del derecho o a una ' +
          'entidad especializada, no a este motor.',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'asylum_seeker' } },
    },
    {
      id: 'es-arr-sf-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Not currently the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'Art. 126.h), added by RD 316/2026 with effect from 16 April 2026, also bars anyone who is an ' +
          'interested party in a pending procedure for the grant, extension, renewal or modification of a ' +
          'stay or residence authorisation. Note that a person already holding a student stay authorisation ' +
          'is caught by this requirement and is not on this route.',
        es:
          'El art. 126.h), añadido por el RD 316/2026 con efectos desde el 16 de abril de 2026, excluye ' +
          'también a quien sea persona interesada en un procedimiento pendiente de concesión, prórroga, ' +
          'renovación o modificación de autorizaciones de estancia o residencia. Conviene advertir que quien ' +
          'ya sea titular de una autorización de estancia por estudios queda comprendido en este requisito y ' +
          'no accede por esta vía.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-sf-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'Art. 126.d) covers Spain and the countries of residence during the five years before *entering* ' +
          'Spain; this criterion checks the country of nationality only. Under art. 130.2 the Spanish record ' +
          'and the police report are obtained by the oficina de extranjería of its own motion, and no ' +
          'third-country certificate is needed where the applicant has been in Spain continuously for the ' +
          'five years immediately before filing.',
        es:
          'El art. 126.d) abarca España y los países de residencia en los cinco años anteriores a la ' +
          '*entrada* en España; este criterio comprueba únicamente el país de nacionalidad. Conforme al art. ' +
          '130.2, el certificado español y el informe policial los recaba de oficio la oficina de ' +
          'extranjería, y no se exige certificado de terceros países cuando se ha permanecido en España de ' +
          'forma continuada los cinco años inmediatamente anteriores a la solicitud.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-sf-predecessor-note',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-arraigo-rd-557-2011-art-124-derogado'],
      label: {
        en: 'Applications filed before 20 May 2025 are decided under the previous Reglamento',
        es: 'Las solicitudes presentadas antes del 20 de mayo de 2025 se resuelven conforme al Reglamento anterior',
      },
      guidance: {
        en:
          'This figure was *arraigo para la formación* under RD 557/2011 art. 124.4: two years’ presence plus ' +
          'a commitment to regulated training, with enrolment to follow within three months of the grant. RD ' +
          '1155/2024 disposición transitoria segunda applies old law by default and new law at the ' +
          'applicant’s election. Holders of an *arraigo para la formación* authorisation granted under the ' +
          'old Reglamento have their own transitional routes into a residence-and-work authorisation or into ' +
          'this figure; those are set out in Instrucción sexta of the SEM instructions and are not modelled ' +
          'here.',
        es:
          'Esta figura era el *arraigo para la formación* del art. 124.4 del RD 557/2011: dos años de ' +
          'permanencia y compromiso de realizar una formación reglada, con matriculación en los tres meses ' +
          'siguientes a la concesión. La disposición transitoria segunda del RD 1155/2024 aplica por defecto ' +
          'la normativa anterior y la nueva a elección de la persona interesada. Quienes sean titulares de un ' +
          '*arraigo para la formación* concedido con el Reglamento anterior disponen de vías transitorias ' +
          'propias hacia una autorización de residencia y trabajo o hacia esta figura, previstas en la ' +
          'Instrucción sexta de las Instrucciones SEM y no modeladas aquí.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: RLOEX_IN_FORCE },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    renewalMonths: 12,
    citationIds: ['es-arraigo-rloex-art-125', 'es-arraigo-rloex-art-131', 'es-arraigo-rloex-art-132'],
    note: {
      en:
        'One year, and each prórroga one year (arts. 125.2 and 132.1). Unlike the other arraigo figures, the ' +
        'work authorisation is capped: art. 131.b) permits employed work of at most thirty hours a week in ' +
        'aggregate, paid at least the minimum wage or the applicable collective-agreement wage in proportion ' +
        'to the hours. A prórroga is conditional on a report from the training centre certifying promotion to ' +
        'the second year of a basic or intermediate vocational cycle or, where the training finished early, ' +
        'on the qualification obtained plus active job-seeking (art. 132.2.b)).',
      es:
        'Un año, y cada prórroga un año (arts. 125.2 y 132.1). A diferencia de las demás figuras de arraigo, ' +
        'la autorización de trabajo está limitada: el art. 131.b) permite trabajar por cuenta ajena un máximo ' +
        'de treinta horas semanales en cómputo global, con al menos el salario mínimo interprofesional o el ' +
        'del convenio aplicable en proporción a la jornada. La prórroga se condiciona al informe del centro ' +
        'que certifique la promoción al segundo curso en los ciclos de grado básico o medio o, si la ' +
        'formación terminó antes, al título o certificado obtenido y a la búsqueda activa de empleo (art. ' +
        '132.2.b)).',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Arraigo familiar — art. 127.e)
// ---------------------------------------------------------------------------

/**
 * The one figure with **no minimum presence requirement** — art. 126.b) says so
 * expressly — and the one most likely to be encoded wrongly from memory, because
 * its population changed. Under RD 557/2011 it was built around family members
 * of *Spanish* nationals. It is now confined to family members of nationals of
 * another EU member state, the EEA or Switzerland. The Spanish-national cases
 * did not disappear; they moved to Título IV Capítulo VII of the Reglamento,
 * arts. 93–99, *Residencia temporal de familiares de personas con nacionalidad
 * española*, which is a different route and is not in this catalog.
 */
export const esArraigoFamiliar: Pathway = {
  id: 'es-arraigo-familiar',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'open',
  openedOn: RLOEX_IN_FORCE,
  name: {
    en: 'Arraigo familiar — family rootedness',
    es: 'Arraigo familiar',
  },
  summary: {
    en:
      'Five years of residence, with work authorisation and no minimum period of prior presence in Spain, for ' +
      'the parent or guardian of a minor who is a national of another EU member state, the EEA or ' +
      'Switzerland, or for a relative supporting a person with a disability who is such a national. Under ' +
      'Real Decreto 557/2011 this figure was built around family members of Spanish nationals; those cases ' +
      'are now a separate route in Título IV Capítulo VII of the Reglamento.',
    es:
      'Cinco años de residencia, con autorización de trabajo y sin exigencia de permanencia previa en ' +
      'España, para el padre, la madre o el tutor de un menor nacional de otro Estado miembro de la Unión ' +
      'Europea, del Espacio Económico Europeo o de Suiza, o para el familiar que presta apoyo a una persona ' +
      'con discapacidad de esa misma nacionalidad. Con el Real Decreto 557/2011 esta figura giraba en torno ' +
      'a los familiares de personas de nacionalidad española; esos supuestos son hoy una vía distinta, en el ' +
      'Título IV Capítulo VII del Reglamento.',
  },
  citations: [
    rloexArt125,
    rloexArt126,
    rloexArt127e,
    rloexArt130,
    rloexArt131,
    rloexArt132,
    rloexDt3,
    rd316_2026,
    semFamiliar,
    rd557Art124,
  ],
  criteria: [
    {
      id: 'es-arr-fam-eu-family-member',
      kind: 'status',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-art-127-e', 'es-arraigo-sem-1-2025-familiar'],
      label: {
        en: 'Parent or guardian of an EU, EEA or Swiss minor, or relative supporting such a national with a disability',
        es: 'Progenitor o tutor de un menor de la UE, EEE o Suiza, o familiar que presta apoyo a un nacional de esos Estados con discapacidad',
      },
      humanReviewReason: {
        en:
          'This engine holds no family relationships and no facts about anybody other than the applicant, so ' +
          'neither the relationship, the relative’s nationality, the care arrangement nor cohabitation can be ' +
          'checked here.',
        es:
          'Este motor no guarda relaciones familiares ni datos de personas distintas de la solicitante, de ' +
          'modo que aquí no pueden comprobarse ni el vínculo, ni la nacionalidad del familiar, ni la ' +
          'situación de guarda, ni la convivencia.',
      },
      guidance: {
        en:
          'Two cases, and in both the family member must be a national of another EU member state, the EEA or ' +
          'Switzerland. First: the applicant is the father, mother or guardian of a minor who is such a ' +
          'national, resides in Spain, has the minor in their care and either lives with the minor or is up ' +
          'to date with parental obligations. Second: the applicant provides support to a person with a ' +
          'disability who is such a national for the exercise of their legal capacity, is a relative of that ' +
          'person, has them in their care and lives with them; Instrucción séptima of the SEM instructions ' +
          'reads that second case as available to only one relative. **A tie to a Spanish national is not ' +
          'this route.** Since 20 May 2025 the parent of a Spanish child, the spouse or partner of a Spanish ' +
          'national and their ascendants and descendants are covered by Título IV Capítulo VII of the ' +
          'Reglamento, arts. 93–99, which is not modelled in this catalog. Anyone who held an arraigo ' +
          'familiar authorisation or an EU-family-member card on a tie to a Spanish national that was valid ' +
          'on 20 May 2025 keeps their residence under disposición transitoria tercera without filing a new ' +
          'application.',
        es:
          'Dos supuestos, y en ambos el familiar debe ser nacional de otro Estado miembro de la Unión ' +
          'Europea, del Espacio Económico Europeo o de Suiza. Primero: ser padre, madre o tutor de un menor ' +
          'con esa nacionalidad, residir en territorio nacional, tener al menor a cargo y convivir con él o ' +
          'estar al corriente de las obligaciones paternofiliales. Segundo: prestar apoyo, para el ejercicio ' +
          'de su capacidad jurídica, a una persona con discapacidad de esa nacionalidad, siendo familiar ' +
          'suyo, teniéndola a cargo y conviviendo con ella; la Instrucción séptima de las Instrucciones SEM ' +
          'entiende que este segundo supuesto solo puede aplicarse a un único familiar. **El vínculo con una ' +
          'persona de nacionalidad española no es esta vía.** Desde el 20 de mayo de 2025, el progenitor de ' +
          'un menor español, el cónyuge o pareja de un nacional español y sus ascendientes y descendientes se ' +
          'rigen por el Título IV Capítulo VII del Reglamento, arts. 93 a 99, que no está modelado en este ' +
          'catálogo. Quien tuviera vigente el 20 de mayo de 2025 una autorización de arraigo familiar o una ' +
          'tarjeta de familiar de ciudadano de la Unión por vínculo con un español conserva la residencia ' +
          'conforme a la disposición transitoria tercera, sin presentar nueva solicitud.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-fam-no-minimum-presence',
      kind: 'residence',
      weight: 'informational',
      citationIds: ['es-arraigo-rloex-art-126'],
      label: {
        en: 'No minimum period of presence in Spain is required for this figure',
        es: 'Esta figura no exige ningún periodo mínimo de permanencia en España',
      },
      guidance: {
        en:
          'Art. 126.b) closes with "El arraigo familiar no requerirá ninguna permanencia mínima." The other ' +
          'general requirements of art. 126 still apply cumulatively, and the applicant must be in Spain when ' +
          'the application is filed (art. 126.a)). This criterion states the position; it is informational ' +
          'and never affects the verdict.',
        es:
          'El art. 126.b) termina diciendo: «El arraigo familiar no requerirá ninguna permanencia mínima.» ' +
          'Los demás requisitos generales del art. 126 siguen aplicándose de forma acumulativa, y la persona ' +
          'solicitante debe encontrarse en España al presentar la solicitud (art. 126.a)). Este criterio deja ' +
          'constancia de esa posición; es informativo y no altera el resultado.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-fam-not-protection-applicant',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126'],
      label: {
        en: 'Not an applicant for international protection when filing or while the application is processed',
        es: 'No tener la condición de solicitante de protección internacional al solicitar ni durante la tramitación',
      },
      guidance: {
        en:
          'Art. 126.a) applies to arraigo familiar as it does to the other figures, even though the ' +
          'two-year presence requirement does not. Anyone with a live protection claim, or who may have ' +
          'grounds for one, should take that to a lawyer or a specialised organisation rather than to this ' +
          'engine.',
        es:
          'El art. 126.a) se aplica al arraigo familiar igual que a las demás figuras, aunque no lo haga el ' +
          'requisito de permanencia de dos años. Quien tenga una solicitud de protección viva, o motivos para ' +
          'presentarla, debe acudir a un profesional del derecho o a una entidad especializada, no a este ' +
          'motor.',
      },
      evaluator: { op: 'not', of: { op: 'equals', path: 'currentStatus', value: 'asylum_seeker' } },
    },
    {
      id: 'es-arr-fam-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'Not currently the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'Art. 126.h), added by RD 316/2026 with effect from 16 April 2026, also bars anyone who is an ' +
          'interested party in a pending procedure for the grant, extension, renewal or modification of a ' +
          'stay or residence authorisation. This engine holds no record of pending procedures, so that half ' +
          'of the requirement is not checked here.',
        es:
          'El art. 126.h), añadido por el RD 316/2026 con efectos desde el 16 de abril de 2026, excluye ' +
          'también a quien sea persona interesada en un procedimiento pendiente de concesión, prórroga, ' +
          'renovación o modificación de autorizaciones de estancia o residencia. Este motor no guarda ' +
          'procedimientos en tramitación, por lo que esa mitad del requisito no se comprueba aquí.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-fam-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'Art. 126.d) covers Spain and the countries of residence during the five years before *entering* ' +
          'Spain; this criterion checks the country of nationality only. Under art. 130.2 the Spanish record ' +
          'and the police report are obtained by the oficina de extranjería of its own motion.',
        es:
          'El art. 126.d) abarca España y los países de residencia en los cinco años anteriores a la ' +
          '*entrada* en España; este criterio comprueba únicamente el país de nacionalidad. Conforme al art. ' +
          '130.2, el certificado español y el informe policial los recaba de oficio la oficina de ' +
          'extranjería.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-fam-predecessor-note',
      kind: 'procedural',
      weight: 'informational',
      citationIds: ['es-arraigo-rd-557-2011-art-124-derogado', 'es-arraigo-rloex-dt-3'],
      label: {
        en: 'Applications filed before 20 May 2025 are decided under the previous Reglamento',
        es: 'Las solicitudes presentadas antes del 20 de mayo de 2025 se resuelven conforme al Reglamento anterior',
      },
      guidance: {
        en:
          'RD 557/2011 art. 124.3 gave arraigo familiar to the parent or guardian of a **Spanish** minor, to ' +
          'a person supporting a Spanish national with a disability, to the spouse or registered partner of a ' +
          'Spanish national and to certain of their ascendants and descendants, and to the children of a ' +
          'formerly-Spanish parent. An application lodged before 20 May 2025 is decided under that text ' +
          'unless the applicant elects the new Reglamento. Existing holders are protected by disposición ' +
          'transitoria tercera.',
        es:
          'El art. 124.3 del RD 557/2011 reconocía el arraigo familiar al padre, madre o tutor de un menor ' +
          '**español**, a quien prestaba apoyo a una persona española con discapacidad, al cónyuge o pareja ' +
          'de hecho de un nacional español y a determinados ascendientes y descendientes suyos, y a los hijos ' +
          'de padre o madre originariamente españoles. Una solicitud presentada antes del 20 de mayo de 2025 ' +
          'se resuelve conforme a ese texto, salvo que la persona interesada opte por el nuevo Reglamento. ' +
          'Los titulares actuales quedan amparados por la disposición transitoria tercera.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: RLOEX_IN_FORCE },
    },
  ],
  durations: {
    initialGrantMonths: 60,
    renewalMonths: 60,
    citationIds: ['es-arraigo-rloex-art-125', 'es-arraigo-rloex-art-131', 'es-arraigo-rloex-art-132'],
    note: {
      en:
        'Five years, not one: art. 125.2 and art. 132.1 both carve arraigo familiar out of the one-year rule ' +
        'that governs the other four figures, and a prórroga runs five years too. The authorisation carries ' +
        'employed and self-employed work rights with no geographical or occupational limit (art. 131). The ' +
        'job-seeking condition in art. 132.2.a) applies to second-chance, sociolaboral and social arraigo, ' +
        'not to this one.',
      es:
        'Cinco años, no uno: los arts. 125.2 y 132.1 excluyen el arraigo familiar de la regla de un año que ' +
        'rige para las otras cuatro figuras, y la prórroga es también de cinco años. La autorización lleva ' +
        'aparejada autorización de trabajo por cuenta ajena y propia sin límite geográfico ni de ocupación ' +
        '(art. 131). La condición de búsqueda activa de empleo del art. 132.2.a) se aplica al arraigo de ' +
        'segunda oportunidad, al sociolaboral y al social, no a éste.',
    },
  },
  leadsTo: ['es-nationality-residence-reduced', 'es-nationality-residence-general'],
  reviewStatus: 'unreviewed',
};

// ---------------------------------------------------------------------------
// Arraigo extraordinario — disposición adicional vigesimoprimera — CLOSED
// ---------------------------------------------------------------------------

/**
 * Kept although it is closed, for the same reason Spain's investor route is kept:
 * people who filed inside the window are waiting on decisions right now, and a
 * missing record answers them with a 404 rather than with the rule they were
 * measured against.
 *
 * The window ran from 16 April 2026, when RD 316/2026 entered into force, to
 * 30 June 2026 inclusive. Nothing published in the BOE since has extended it.
 */
export const esArraigoExtraordinario: Pathway = {
  id: 'es-arraigo-extraordinario',
  version: '1.0.0',
  jurisdiction: ES,
  kind: 'residence_permit',
  status: 'closed',
  openedOn: isoDate('2026-04-16'),
  closedOn: EXTRAORDINARIO_CLOSED_ON,
  name: {
    en: 'Arraigo extraordinario — closed to new applications',
    es: 'Arraigo extraordinario — cerrado a nuevas solicitudes',
  },
  summary: {
    en:
      'A time-limited route added to the Reglamento by Real Decreto 316/2026 for people who were in Spain ' +
      'before 1 January 2026, had been present without interruption for the five months before filing, held ' +
      'no stay or residence authorisation, and could show work, a family unit or a certified situation of ' +
      'vulnerability. It granted one year of residence with full work rights. Applications closed on 30 June ' +
      '2026.',
    es:
      'Vía temporal añadida al Reglamento por el Real Decreto 316/2026 para quienes se encontraban en España ' +
      'antes del 1 de enero de 2026, habían permanecido de forma ininterrumpida los cinco meses anteriores a ' +
      'la solicitud, no eran titulares de autorización de estancia o residencia y podían acreditar trabajo, ' +
      'unidad familiar o una situación de vulnerabilidad certificada. Concedía un año de residencia con ' +
      'plenos derechos de trabajo. El plazo de solicitud terminó el 30 de junio de 2026.',
  },
  closureNote: {
    en:
      'No new application can be made: DA 21.6 allowed the authorisation to be applied for "hasta el 30 de ' +
      'junio de 2026", and nothing published in the BOE since has extended that date. If you filed inside ' +
      'the window your application is still live — the maximum period for deciding it is three months from ' +
      'the day after it reached the register of the competent body, extendable by suspension, and no answer ' +
      'within that period is a refusal by administrative silence (DA 21.4). While it is pending you are ' +
      'provisionally authorised to reside and to work, employed or self-employed, anywhere in Spain and in ' +
      'any occupation, and a refusal ends that provisional authorisation automatically. If you were granted ' +
      'the authorisation, it runs one year, and you must apply in the two months before it expires to modify ' +
      'it under art. 191 of the Reglamento. Take a pending or refused application to a lawyer: this engine ' +
      'can restate the rule but cannot tell you how it applies to your file.',
    es:
      'No caben nuevas solicitudes: la DA 21.6 permitía solicitar la autorización «hasta el 30 de junio de ' +
      '2026», y nada publicado después en el BOE ha prorrogado esa fecha. Si presentó la solicitud dentro ' +
      'del plazo, su expediente sigue vivo: el plazo máximo de resolución es de tres meses desde el día ' +
      'siguiente a su entrada en el registro del órgano competente, susceptible de suspensión, y la falta de ' +
      'notificación en ese plazo equivale a desestimación por silencio administrativo (DA 21.4). Mientras se ' +
      'tramita, está habilitado provisionalmente para residir y trabajar por cuenta ajena y propia en todo ' +
      'el territorio y en cualquier ocupación, y la denegación extingue automáticamente esa habilitación. Si ' +
      'obtuvo la autorización, tiene una vigencia de un año y deberá solicitar su modificación conforme al ' +
      'art. 191 del Reglamento en los dos meses anteriores a su expiración. Lleve un expediente pendiente o ' +
      'denegado a un profesional del derecho: este motor puede reproducir la norma, pero no decirle cómo se ' +
      'aplica a su caso.',
  },
  citations: [rloexDa21, rd316_2026, rloexArt126, rloexArt130],
  criteria: [
    {
      id: 'es-arr-ext-filed-within-window',
      kind: 'procedural',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-da-21', 'es-arraigo-rd-316-2026'],
      label: {
        en: 'The application was lodged on or before 30 June 2026',
        es: 'La solicitud se presentó el 30 de junio de 2026 o antes',
      },
      guidance: {
        en:
          'DA 21.6: the authorisation "podrá ser solicitada hasta el 30 de junio de 2026". The window opened ' +
          'on 16 April 2026, when RD 316/2026 entered into force. 30 June was itself a filing day, so an ' +
          'application lodged that day is inside the window; 1 July 2026 is the first day it was not.',
        es:
          'DA 21.6: la autorización «podrá ser solicitada hasta el 30 de junio de 2026». El plazo se abrió el ' +
          '16 de abril de 2026, con la entrada en vigor del RD 316/2026. El 30 de junio era día hábil de ' +
          'presentación, de modo que la solicitud presentada ese día está dentro de plazo; el 1 de julio de ' +
          '2026 es el primer día en que ya no lo estaba.',
      },
      evaluator: { op: 'date_before', path: 'applicationLodgedOn', value: EXTRAORDINARIO_CLOSED_ON },
    },
    {
      id: 'es-arr-ext-presence',
      kind: 'residence',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-da-21'],
      label: {
        en: 'In Spain before 1 January 2026, and present without interruption for the five months before filing',
        es: 'Encontrarse en España antes del 1 de enero de 2026 y haber permanecido de forma ininterrumpida los cinco meses anteriores a la solicitud',
      },
      humanReviewReason: {
        en:
          'Both limbs are about physical presence, which this engine does not hold. DA 21.1.e) allows them ' +
          'to be proved "mediante cualquier prueba válida en derecho" provided the evidence carries personal ' +
          'data identifying the applicant, which is a documentary assessment rather than a computation.',
        es:
          'Ambos extremos versan sobre permanencia física, dato que este motor no almacena. La DA 21.1.e) ' +
          'permite acreditarlos «mediante cualquier prueba válida en derecho» siempre que incluya datos ' +
          'personales que permitan acreditar la identidad, lo que es una valoración documental y no un ' +
          'cálculo.',
      },
      guidance: {
        en:
          'Unlike the ordinary arraigo figures this route required five months, not two years, and the ' +
          'presence had to be uninterrupted. Separately, the applicant had to have been in Spain before 1 ' +
          'January 2026. DA 21.1 also required being of full age, being in Spain when filing, supplying a ' +
          'full copy of a passport, cédula de inscripción or travel document — current or expired — and ' +
          'neither holding nor ever having held a residence authorisation under Council Implementing Decision ' +
          '(EU) 2022/382 on temporary protection for people displaced from Ukraine. None of those is modelled ' +
          'separately here.',
        es:
          'A diferencia de las figuras ordinarias de arraigo, esta vía exigía cinco meses, no dos años, y la ' +
          'permanencia debía ser ininterrumpida. Además, había que encontrarse en España antes del 1 de enero ' +
          'de 2026. La DA 21.1 exigía también ser mayor de edad, hallarse en España al presentar la ' +
          'solicitud, aportar copia completa del pasaporte, cédula de inscripción o título de viaje —en vigor ' +
          'o caducado— y no ser ni haber sido titular de una autorización de residencia obtenida conforme a ' +
          'la Decisión de Ejecución (UE) 2022/382 sobre protección temporal para personas desplazadas de ' +
          'Ucrania. Ninguno de esos extremos se modela aquí por separado.',
      },
      evaluator: { op: 'equals', path: 'targetJurisdiction', value: 'ES' },
    },
    {
      id: 'es-arr-ext-age',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-da-21'],
      label: {
        en: 'Of full age',
        es: 'Ser mayor de edad',
      },
      guidance: {
        en:
          'DA 21.1.a). Accompanying minors were dealt with by the transitional provision of RD 316/2026 and ' +
          'by Título IX Capítulo I of the Reglamento, not by this route.',
        es:
          'DA 21.1.a). Los menores acompañados se resolvían por la disposición transitoria del RD 316/2026 y ' +
          'por el Título IX Capítulo I del Reglamento, no por esta vía.',
      },
      evaluator: { op: 'gte', path: 'derived.ageYears', value: 18 },
    },
    {
      id: 'es-arr-ext-no-current-authorisation',
      kind: 'status',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-da-21'],
      label: {
        en: 'Not the holder of a stay or residence authorisation',
        es: 'No ser titular de una autorización de estancia o residencia',
      },
      guidance: {
        en:
          'DA 21.1.a) and b). The second limb — not being an interested party in a pending procedure for the ' +
          'grant, extension, renewal or modification of a stay or residence authorisation — is not checked ' +
          'here, because this engine holds no record of pending procedures.',
        es:
          'DA 21.1.a) y b). El segundo extremo —no ostentar la condición de persona interesada en un ' +
          'procedimiento pendiente de concesión, prórroga, renovación o modificación de autorizaciones de ' +
          'estancia o residencia— no se comprueba aquí, porque este motor no guarda procedimientos en ' +
          'tramitación.',
      },
      evaluator: {
        op: 'not',
        of: {
          op: 'one_of',
          path: 'currentStatus',
          values: ['resident', 'permanent_resident', 'worker', 'student', 'citizen'],
        },
      },
    },
    {
      id: 'es-arr-ext-criminal-record',
      kind: 'character',
      weight: 'blocking',
      citationIds: ['es-arraigo-rloex-da-21', 'es-arraigo-rloex-art-126', 'es-arraigo-rloex-art-130'],
      label: {
        en: 'Criminal-record certificate from the country of nationality shows no convictions',
        es: 'Certificado de antecedentes penales del país de nacionalidad sin condenas',
      },
      guidance: {
        en:
          'DA 21.1.f) applies art. 126.d): no criminal record in Spain or in the countries of residence in ' +
          'the five years before entering Spain, for offences that exist in Spanish law. Records that can be ' +
          'cancelled in Spain are disregarded, and the applicant had to ask for cancellation before the ' +
          'decision was notified. DA 21.9 set up a diplomatic route for obtaining a foreign certificate where ' +
          'the applicant had asked for one and a month had passed with no answer. Under DA 21.1.g) a police ' +
          'report was also assessed, and an entry in it was not by itself and automatically a ground of ' +
          'refusal.',
        es:
          'La DA 21.1.f) remite al art. 126.d): carecer de antecedentes penales en España y en los países de ' +
          'residencia en los cinco años anteriores a la entrada en España, por delitos previstos en el ' +
          'ordenamiento español. No se toman en consideración los antecedentes susceptibles de cancelación en ' +
          'España, y la persona interesada debía pedir la cancelación antes de que se notificara la ' +
          'resolución. La DA 21.9 previó una vía diplomática para obtener el certificado extranjero cuando se ' +
          'había solicitado y había transcurrido un mes sin respuesta. Conforme a la DA 21.1.g) se valoraba ' +
          'además un informe policial, sin que la existencia de antecedentes en él fuera por sí sola y de ' +
          'forma automática causa de denegación.',
      },
      evaluator: {
        op: 'collection_any',
        path: 'criminalRecord.certificates',
        where: {
          op: 'all_of',
          of: [
            { op: 'equals_field', path: 'jurisdiction', otherPath: '$.claimedNationality' },
            { op: 'is_true', path: 'clear' },
          ],
        },
      },
    },
    {
      id: 'es-arr-ext-additional-ground',
      kind: 'employment',
      weight: 'blocking',
      requiresHumanReview: true,
      citationIds: ['es-arraigo-rloex-da-21'],
      label: {
        en: 'At least one of: work done or intended, a family unit in Spain, or certified vulnerability',
        es: 'Al menos uno de: trabajo realizado o intención de trabajar, unidad familiar en España o vulnerabilidad acreditada',
      },
      humanReviewReason: {
        en:
          'Only the first limb touches anything this engine holds, and only loosely. It records no family ' +
          'relationships and no vulnerability assessment, and a vulnerability certificate is issued by a ' +
          'social-assistance body or a registered third-sector entity, not computed.',
        es:
          'Solo el primer extremo roza algo que este motor almacene, y de forma tenue. No registra relaciones ' +
          'familiares ni valoraciones de vulnerabilidad, y el certificado de vulnerabilidad lo emite una ' +
          'entidad competente en asistencia social o del Tercer Sector inscrita en el registro ' +
          'correspondiente; no se calcula.',
      },
      guidance: {
        en:
          'DA 21.2 required at least one of three things. First, having worked in Spain, employed or ' +
          'self-employed, during the applicant’s time here, or showing an intention to work through a job ' +
          'offer or, for self-employment, a declaración responsable — any contractual form was admitted ' +
          'provided the contract or the sum of contracts ran more than ninety days in a year. Second, living ' +
          'in Spain with a family unit of minor children, adult children with a disability requiring support ' +
          'or who cannot objectively provide for themselves because of their health, or first-degree ' +
          'ascendants they lived with. Third, a certified situation of vulnerability, certified by the bodies ' +
          'competent in social assistance or by third-sector entities on the Registro Electrónico de ' +
          'Colaboradores de Extranjería, the certificate having effect for this provision only.',
        es:
          'La DA 21.2 exigía al menos uno de tres extremos. Primero, haber trabajado en España por cuenta ' +
          'ajena o propia durante la permanencia, o acreditar la intención de trabajar mediante una oferta de ' +
          'empleo o, por cuenta propia, una declaración responsable; se admitía cualquier modalidad ' +
          'contractual siempre que el contrato o la suma de contratos superara los noventa días en un año. ' +
          'Segundo, permanecer en España junto con una unidad familiar compuesta por hijos menores, hijos ' +
          'mayores con discapacidad que requiera apoyo o que no sean objetivamente capaces de proveer a sus ' +
          'necesidades por su estado de salud, o ascendientes de primer grado con los que se conviva. ' +
          'Tercero, encontrarse en situación de vulnerabilidad acreditada por las entidades competentes en ' +
          'asistencia social o por entidades del Tercer Sector inscritas en el Registro Electrónico de ' +
          'Colaboradores de Extranjería, con efectos limitados a esta disposición.',
      },
      evaluator: { op: 'is_present', path: 'jobOffer' },
    },
  ],
  durations: {
    initialGrantMonths: 12,
    citationIds: ['es-arraigo-rloex-da-21', 'es-arraigo-rloex-art-130'],
    note: {
      en:
        'One year, with employed and self-employed work rights anywhere in Spain and in any occupation (DA ' +
        '21.10). The holder must apply in the two months before expiry to modify the authorisation under art. ' +
        '191 of the Reglamento; filing then extends the previous authorisation until the procedure is ' +
        'resolved, as does filing within three months after expiry. Exceptionally, where no modification can ' +
        'be applied for, the authorisation may be extended for a further year on proof of active job-seeking ' +
        'and registration with the public employment service, or on a favourable integration-effort report ' +
        'from the Comunidad Autónoma; and where justified circumstances such as serious illness, disability ' +
        'in the family or retirement age prevent access to work, the extension runs four years. No ' +
        'processing-time figure is asserted here beyond the three-month maximum for deciding the application ' +
        'that DA 21.4 itself sets.',
      es:
        'Un año, con autorización de trabajo por cuenta ajena y propia en todo el territorio y en cualquier ' +
        'ocupación (DA 21.10). El titular debe solicitar, en los dos meses previos a la expiración, la ' +
        'modificación de la autorización conforme al art. 191 del Reglamento; la presentación prorroga la ' +
        'autorización anterior hasta la resolución del procedimiento, igual que su presentación dentro de los ' +
        'tres meses posteriores a la expiración. Excepcionalmente, si no cabe solicitar la modificación, la ' +
        'autorización puede prorrogarse un año más acreditando búsqueda activa de empleo e inscripción en el ' +
        'servicio público de empleo o aportando un informe favorable de esfuerzo de integración de la ' +
        'Comunidad Autónoma; y si concurren circunstancias debidamente justificadas —enfermedad grave, ' +
        'discapacidad en la familia o edad de jubilación— que impidan el acceso al empleo, la prórroga es de ' +
        'cuatro años. No se afirma aquí ningún plazo de tramitación más allá del máximo de tres meses de ' +
        'resolución que fija la propia DA 21.4.',
    },
  },
  leadsTo: [],
  reviewStatus: 'unreviewed',
};

export const ES_ARRAIGO_PATHWAYS: readonly Pathway[] = [
  esArraigoSegundaOportunidad,
  esArraigoSociolaboral,
  esArraigoSocial,
  esArraigoSocioformativo,
  esArraigoFamiliar,
  esArraigoExtraordinario,
];
