import type { Metadata } from 'next';

import { bi } from '@/lib/i18n';
import { plural } from '@/lib/ui';
import { CATALOG, NOTHING_IS_COUNSEL_REVIEWED } from '@/lib/catalog-facts';
import {
  COVERAGE_LEAD,
  COVERAGE_NOT_EXHAUSTIVE,
  COVERAGE_OUT_OF_SCOPE,
  COVERAGE_TITLE,
  COVERAGE_WHERE_TO_ASK,
  JURISDICTIONS_WITHOUT_REGISTER,
  UNCOVERED_ROUTES,
} from '@/lib/coverage';
import { PORTAL_URL, REPO_URL } from '@/lib/links';
import { Badge, Chip } from '@/components/Badge';
import { T, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import {
  ActionLink,
  Card,
  CivilDate,
  Fact,
  Facts,
  Figure,
  Grid,
  Page,
  PageHeader,
  ScrollX,
  Section,
  Stack,
} from '@/components/Layout';

import styles from './page.module.css';

/**
 * The marketing site.
 *
 * Two rules govern everything on this page.
 *
 * **Every number is counted, not written.** The catalog figures come from
 * `lib/catalog-facts.ts`, which reads the same `@meridian/pathways` catalog the
 * engine evaluates. There are no adoption numbers, no processing-time
 * estimates, no success rates, no testimonials and no roadmap dressed as a
 * feature list, because none of those would be true and a platform that tells
 * someone whether they have overstayed cannot spend its credibility on
 * marketing.
 *
 * **The limits get the same prominence as the capabilities.** The advice
 * boundary and the credential refusal are not disclaimers appended at the
 * bottom; they are the middle of the page, because they are the reason the
 * product can be trusted with a matter at all. The status section says plainly
 * how much of the catalog a lawyer has read, and what these applications do not
 * hold.
 *
 * **A limitation is only worth stating if it will still be true tomorrow.** This
 * page used to open by saying nothing was deployed, which is a claim that
 * falsifies itself the moment anybody loads the page from a host — and unlike
 * the catalog figures, a hand-written sentence does not correct itself. What
 * replaced it is the set of statements that hold in either state: no pathway is
 * counsel-reviewed until one is signed off (counted), no government integration
 * is provisioned, and none of the three applications has an account, a sign-in or
 * a database. Deployment does not change any of those; shipping the corresponding
 * feature does, and then the sentence describing it changes with it.
 */

/**
 * The canonical address, declared on the route rather than on the layout.
 *
 * It belongs here because it is true of exactly this route. Root-layout metadata
 * is inherited by every page under it, including `not-found.tsx`, and a 404
 * carrying `<link rel="canonical" href="/">` tells a crawler that the address it
 * failed to find *is* the home page — which is the one thing the not-found page
 * exists to deny.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const CATALOG_JURISDICTIONS = CATALOG.jurisdictions.map((j) => j.code).join(', ');

export default function HomePage() {
  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            <Chip>Migration lifecycle engine</Chip>
            <Chip>{CATALOG_JURISDICTIONS}</Chip>
            <Chip>AGPL-3.0</Chip>
          </>
        }
        title={bi(
          'The rules, your figures, and the arithmetic between them',
          'Las normas, sus cifras y la aritmética que las une',
        )}
        lead={bi(
          'Meridian assesses eligibility against a versioned catalog of migration pathways where every rule carries the instrument it comes from, assembles the documents that pathway needs with their legalisation and sworn-translation routing, validates machine-readable travel documents to ICAO Doc 9303, and counts cross-border presence day by day. It is software. It states what a rule says and measures your own facts against it; it does not tell you what to do unless somebody licensed is accountable for that answer.',
          'Meridian evalúa la elegibilidad frente a un catálogo versionado de vías migratorias en el que cada norma lleva el instrumento del que procede, prepara la documentación que esa vía exige con su enrutado de legalización y traducción jurada, valida documentos de viaje de lectura mecánica conforme al Doc 9303 de OACI y computa la presencia transfronteriza día a día. Es software. Expone lo que dice una norma y mide sus propios datos frente a ella; no le dice qué hacer salvo que alguien con licencia responda de esa respuesta.',
        )}
        actions={
          <>
            <ActionLink
              href={PORTAL_URL}
              variant="primary"
              label={bi('Open the applicant portal', 'Abrir el portal del solicitante')}
            />
            <ActionLink
              href={REPO_URL}
              newTab
              label={bi('Read the source on GitHub', 'Ver el código fuente en GitHub')}
            />
          </>
        }
      />

      {/*
        The honest summary sits above the capabilities rather than below them. A
        visitor who reads no further than the first screen should still leave
        knowing how much of the catalog a lawyer has read and what these
        applications do not hold. The counsel figure is counted, so the sentence
        built on it stops applying by itself once a record is signed off.
      */}
      <Callout
        tone="info"
        icon="i"
        level={2}
        title={bi('Read this before the feature list', 'Lea esto antes de la lista de funciones')}
      >
        <TProse
          text={bi(
            `The catalog ships ${plural(CATALOG.pathways, 'pathway', 'pathways')}, of which ${CATALOG.counselReviewed} ${CATALOG.counselReviewed === 1 ? 'carries' : 'carry'} a counsel sign-off. ${NOTHING_IS_COUNSEL_REVIEWED ? 'That is why every recommendation-class output is blocked today' : 'Only the signed-off records may enter a recommendation'} — by design, not by accident. No government integration is provisioned, and no application in this product holds an account, a sign-in or a database.`,
            `El catálogo incluye ${CATALOG.pathways} vías, de las cuales ${CATALOG.counselReviewed} ${CATALOG.counselReviewed === 1 ? 'cuenta' : 'cuentan'} con validación de letrado. ${NOTHING_IS_COUNSEL_REVIEWED ? 'Por eso hoy todo resultado de clase recomendación está bloqueado' : 'Solo los registros validados pueden formar parte de una recomendación'}: por diseño, no por descuido. No hay ninguna integración pública aprovisionada, y ninguna aplicación de este producto tiene cuenta, inicio de sesión ni base de datos.`,
          )}
        />
        {/*
          The counted figures say how much of the catalog a lawyer has read. They
          say nothing about how much of either country's law the catalog reaches,
          and a reader who takes eight records for a map will draw a conclusion
          about their own case that nothing on this page contradicts. So the
          coverage boundary is signposted from the first screen, beside the
          status link, rather than left for whoever scrolls far enough.
        */}
        <p className={styles.calloutLink}>
          <a href="#status">
            <T text={bi('The full status, with counts', 'El estado completo, con cifras')} />
          </a>
        </p>
        <p className={styles.calloutLink}>
          <a href="#coverage">
            <T
              text={bi(
                'What the catalog does not cover, named route by route',
                'Qué no cubre el catálogo, vía por vía',
              )}
            />
          </a>
        </p>
      </Callout>

      <Section
        id="what-it-is"
        title={bi('What Meridian is', 'Qué es Meridian')}
        description={bi(
          'Four engines over one shared contract. Each produces a value you can reconstruct by hand from what is on the screen, and each cites the rule it applied.',
          'Cuatro motores sobre un mismo contrato compartido. Cada uno produce un valor que usted puede reconstruir a mano a partir de lo que ve en pantalla, y cada uno cita la norma que aplicó.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Eligibility, against cited rules', 'Elegibilidad, frente a normas citadas')} />
            </h3>
            <TProse
              text={bi(
                'A pathway is a list of criteria, each attached to the instrument and provision it comes from and the date a person last checked that text. Evaluation is three-valued: met, unmet, or not recorded. A missing fact is never a refusal.',
                'Una vía es una lista de criterios, cada uno vinculado al instrumento y precepto del que procede y a la fecha en que una persona contrastó ese texto por última vez. La evaluación es de tres valores: cumplido, incumplido o sin datos. Un dato ausente nunca es una denegación.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Documents, in the order they must exist', 'Documentos, en el orden en que deben existir')} />
            </h3>
            <TProse
              text={bi(
                'Which document needs legalisation and by which route, which needs a sworn translation and into which language, and how long each stays current — projected forward to the date you intend to file rather than to today, because a certificate that is valid now and expired then is a wasted appointment.',
                'Qué documento necesita legalización y por qué vía, cuál necesita traducción jurada y a qué idioma, y cuánto tiempo sigue vigente cada uno, proyectado a la fecha en que piensa presentar y no a hoy, porque un certificado vigente ahora y caducado entonces es una cita perdida.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Travel documents, to ICAO Doc 9303', 'Documentos de viaje, conforme al Doc 9303 de OACI')} />
            </h3>
            <TProse
              text={bi(
                'Machine-readable zone parsing with the check digits recomputed and the two-digit year windows resolved as the standard specifies. The verdict is returned; the fields read off the document are discarded rather than stored.',
                'Lectura de la zona de lectura mecánica con recálculo de los dígitos de control y resolución de las ventanas de año de dos cifras según especifica la norma. Se devuelve el resultado; los campos leídos del documento se descartan en lugar de almacenarse.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Presence, counted day by day', 'Presencia, contada día a día')} />
            </h3>
            <TProse
              text={bi(
                'One ledger of where you were, feeding tax-residency day counts, the Schengen 90/180 allowance, continuous-residence tests and accumulated work. Entry and exit days both count, and every calculation is civil-date arithmetic: there is no timezone anywhere in it to lose a day to.',
                'Un único registro de dónde estuvo, que alimenta el cómputo fiscal de días, la franquicia Schengen 90/180, las pruebas de residencia continuada y el trabajo acumulado. Los días de entrada y de salida cuentan ambos, y todo el cálculo es aritmética de fechas civiles: no hay ninguna zona horaria en la que perder un día.',
              )}
            />
          </Card>
        </Grid>
      </Section>

      <Section
        id="corridors"
        title={bi('Two corridors seed the catalog', 'Dos corredores siembran el catálogo')}
        description={bi(
          'The engine is jurisdiction-generic. The corridors are data — the evaluator contains no country name and no threshold, so adding a jurisdiction is a new catalog file that a lawyer can read, not a change to the code that applies it.',
          'El motor es genérico respecto a la jurisdicción. Los corredores son datos: el evaluador no contiene ningún nombre de país ni ningún umbral, de modo que añadir una jurisdicción es un nuevo archivo de catálogo que un letrado puede leer, no un cambio en el código que lo aplica.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Mexico to Spain', 'De México a España')} />
            </h3>
            <div className={styles.cardMeta}>
              <Chip>ES</Chip>
              <Chip>{plural(CATALOG.jurisdictions.find((j) => j.code === 'ES')?.pathways ?? 0, 'pathway', 'pathways')}</Chip>
            </div>
            <TProse
              text={bi(
                'Built around nationality by residence on the reduced period that the Civil Code provides for nationals of certain countries, Mexico among them, with the residence permits that can build toward it recorded alongside it — including one route recorded as closed, because a person already holding that status still needs an answer.',
                'Construido en torno a la nacionalidad por residencia con el plazo reducido que el Código Civil prevé para nacionales de determinados países, México entre ellos, junto con las autorizaciones de residencia que pueden conducir a ella, incluida una vía registrada como cerrada, porque quien ya tiene ese estatus sigue necesitando una respuesta.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Mexico to Canada', 'De México a Canadá')} />
            </h3>
            <div className={styles.cardMeta}>
              <Chip>CA</Chip>
              <Chip>{plural(CATALOG.jurisdictions.find((j) => j.code === 'CA')?.pathways ?? 0, 'pathway', 'pathways')}</Chip>
            </div>
            <TProse
              text={bi(
                'The professional work permit under CUSMA Chapter 16, and the Canadian Experience Class it can bridge to once enough authorised Canadian work has accumulated. The catalog records that bridge explicitly, so the work a permit builds is visible while it is being built rather than after.',
                'El permiso de trabajo profesional del capítulo 16 del T-MEC y la Canadian Experience Class a la que puede conducir una vez acumulado suficiente trabajo autorizado en Canadá. El catálogo registra ese enlace de forma explícita, de modo que el tiempo que un permiso va acumulando es visible mientras se acumula y no después.',
              )}
            />
          </Card>
        </Grid>

        <Card tone="sunken">
          <Facts>
            <Fact label={bi('Pathways encoded', 'Vías codificadas')}>
              <Figure value={CATALOG.pathways} unit={bi('routes', 'vías')} />
            </Fact>
            <Fact label={bi('Jurisdictions', 'Jurisdicciones')}>
              <Figure value={CATALOG.jurisdictions.length} />
              {/* ISO country codes are not translated, so they are rendered once
                  rather than through the bilingual pair, which would repeat them. */}
              <div className={styles.factCodes}>{CATALOG_JURISDICTIONS}</div>
            </Fact>
            <Fact label={bi('Eligibility criteria', 'Criterios de elegibilidad')}>
              <Figure value={CATALOG.criteria} />
            </Fact>
            <Fact label={bi('Distinct sources cited', 'Fuentes distintas citadas')}>
              <Figure value={CATALOG.citations} />
              <div className={styles.factNote}>
                <T
                  text={bi(
                    `${CATALOG.discretionaryCitations} marked as administrative practice rather than a statutory threshold`,
                    `${CATALOG.discretionaryCitations} marcadas como práctica administrativa y no como umbral legal`,
                  )}
                />
              </div>
            </Fact>
          </Facts>
        </Card>
      </Section>

      {/*
        Immediately after the corridors, because the corridors section is where
        this page is at its most flattering: two country cards, a count of
        pathways, a count of criteria, a count of sources. Everything in it is
        true and none of it says how small the sample is. A reader who stops
        there leaves believing Meridian has something to say about their case,
        and for most people arriving from either corridor it does not.

        The list is not decoration and not a roadmap — nothing here is promised.
        It is the set of routes a person could reasonably expect to find and will
        not, named specifically enough to take to somebody qualified. Each entry
        retires itself from `lib/coverage.ts` once the catalog answers it, so this
        section cannot go on claiming a hole that has been filled, and cannot
        quietly stop mentioning one that has not.
      */}
      <Section
        id="coverage"
        title={bi('What the catalog does not cover', 'Qué no cubre el catálogo')}
        description={bi(
          'The counts above are real and they are small. This is the other half of that sentence: the significant routes in the same two countries that Meridian does not encode at all.',
          'Las cifras anteriores son reales y son pequeñas. Esta es la otra mitad de la frase: las vías importantes de esos mismos dos países que Meridian no codifica en absoluto.',
        )}
      >
        <Stack gap="md">
          <Callout tone="warn" icon="⚑" title={COVERAGE_TITLE}>
            <TProse text={COVERAGE_LEAD} />
          </Callout>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Not encoded', 'Sin codificar')} />
            </h3>
            <ul className={styles.gaps}>
              {UNCOVERED_ROUTES.map((route) => (
                <li key={route.key}>
                  <Chip>{route.jurisdiction}</Chip> <T text={route.name} />
                </li>
              ))}
            </ul>

            {JURISDICTIONS_WITHOUT_REGISTER.length > 0 ? (
              <TProse
                text={bi(
                  `The catalog also encodes routes for ${JURISDICTIONS_WITHOUT_REGISTER.join(', ')}, and nobody has recorded what is missing there. Treat coverage for ${JURISDICTIONS_WITHOUT_REGISTER.length === 1 ? 'that jurisdiction' : 'those jurisdictions'} as unknown rather than complete.`,
                  `El catálogo también codifica vías para ${JURISDICTIONS_WITHOUT_REGISTER.join(', ')}, y nadie ha dejado constancia de qué falta allí. Considere la cobertura de ${JURISDICTIONS_WITHOUT_REGISTER.length === 1 ? 'esa jurisdicción' : 'esas jurisdicciones'} como desconocida y no como completa.`,
                )}
              />
            ) : null}

            <TProse text={COVERAGE_NOT_EXHAUSTIVE} />
          </Card>

          <Callout
            tone="neutral"
            icon="◆"
            title={bi(
              'Permanently out of scope: protection claims',
              'Fuera de alcance de forma permanente: la protección internacional',
            )}
          >
            <TProse text={COVERAGE_OUT_OF_SCOPE} />
          </Callout>

          <Callout
            tone="accent"
            icon="§"
            title={bi('Who to ask instead', 'A quién preguntar en su lugar')}
          >
            <TProse text={COVERAGE_WHERE_TO_ASK} />
          </Callout>
        </Stack>
      </Section>

      <Section
        id="advice-boundary"
        title={bi('The advice boundary', 'La frontera del asesoramiento')}
        description={bi(
          'Meridian is software. Regulated immigration advice requires an authorised representative attached to the matter, and this platform enforces that in the type system rather than in a disclaimer nobody reads.',
          'Meridian es software. El asesoramiento migratorio reservado exige un representante autorizado vinculado al expediente, y esta plataforma lo impone en el sistema de tipos y no en un descargo de responsabilidad que nadie lee.',
        )}
      >
        <Stack gap="md">
          <TProse
            text={bi(
              'Under s.91 of Canada’s Immigration and Refugee Protection Act, advising or representing a person for consideration in connection with an application is an offence unless the adviser is a lawyer or paralegal in good standing of a law society, a Quebec notary, or a licensee of the College of Immigration and Citizenship Consultants. Spain has its own reserved-activity rules for legal advice. A platform that tells an unrepresented paying consumer which route to take is not shipping a feature; it is committing an offence on behalf of whoever operates it.',
              'Conforme al art. 91 de la Immigration and Refugee Protection Act de Canadá, asesorar o representar a una persona a cambio de contraprestación en relación con una solicitud es delito salvo que quien asesora sea abogado o paralegal colegiado, notario de Quebec o colegiado del College of Immigration and Citizenship Consultants. España tiene sus propias reglas de actividad reservada para el asesoramiento jurídico. Una plataforma que dice a un consumidor de pago y sin representación qué vía tomar no está lanzando una funcionalidad: está cometiendo una infracción por cuenta de quien la explota.',
            )}
          />
          <TProse
            text={bi(
              'So every output is classified where it is produced, never where it is displayed, and it can only ever be moved down. There are exactly three classes.',
              'Por eso cada resultado se clasifica donde se produce, nunca donde se muestra, y solo puede moverse hacia abajo. Hay exactamente tres clases.',
            )}
          />

          <ScrollX>
            <table>
              <caption className={styles.tableCaption}>
                <T
                  text={bi(
                    'The three output classes, and what reaches an applicant with no representative attached',
                    'Las tres clases de resultado y lo que llega a un solicitante sin representante vinculado',
                  )}
                />
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <T text={bi('Class', 'Clase')} />
                  </th>
                  <th scope="col">
                    <T text={bi('What it is', 'Qué es')} />
                  </th>
                  <th scope="col">
                    <T text={bi('Example', 'Ejemplo')} />
                  </th>
                  <th scope="col">
                    <T text={bi('Without a representative', 'Sin representante')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    <T text={bi('Information', 'Información')} />
                  </th>
                  <td>
                    <T
                      text={bi(
                        'A neutral restatement of what a published rule says, with its source. Not applied to anybody’s facts.',
                        'Exposición neutral de lo que dice una norma publicada, con su fuente. No se aplica a los datos de nadie.',
                      )}
                    />
                  </td>
                  <td>
                    <T
                      text={bi(
                        '“The Civil Code sets a two-year residence period for the listed nationalities.”',
                        '«El Código Civil fija un plazo de residencia de dos años para las nacionalidades enumeradas.»',
                      )}
                    />
                  </td>
                  <td>
                    <Badge tone="ok" label={bi('Released', 'Se entrega')} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    <T text={bi('Assessment', 'Evaluación')} />
                  </th>
                  <td>
                    <T
                      text={bi(
                        'Your own recorded facts measured against a cited rule, with the arithmetic shown so you can check it. Reproducible, and not a recommendation.',
                        'Sus propios datos registrados medidos frente a una norma citada, con la aritmética a la vista para que pueda comprobarla. Reproducible, y no es una recomendación.',
                      )}
                    />
                  </td>
                  <td>
                    <T
                      text={bi(
                        '“You have 610 recorded days of residence; the rule states 730.”',
                        '«Tiene 610 días de residencia registrados; la norma exige 730.»',
                      )}
                    />
                  </td>
                  <td>
                    <Badge tone="ok" label={bi('Released', 'Se entrega')} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.rowHead}>
                    <T text={bi('Advice', 'Asesoramiento')} />
                  </th>
                  <td>
                    <T
                      text={bi(
                        'A recommendation, a ranking, a strategy, or a prediction of outcome. A sort order is a recommendation. This is the regulated act.',
                        'Una recomendación, una clasificación, una estrategia o una predicción de resultado. Un orden de clasificación es una recomendación. Este es el acto reservado.',
                      )}
                    />
                  </td>
                  <td>
                    <T
                      text={bi(
                        '“Apply under the work-permit route first.”',
                        '«Solicite primero por la vía del permiso de trabajo.»',
                      )}
                    />
                  </td>
                  <td>
                    <Badge tone="warn" label={bi('Withheld, and named', 'Se retiene, y se indica')} />
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollX>

          <Callout
            tone="accent"
            icon="§"
            title={bi(
              'Withholding is stated, never silent',
              'La retención se declara, nunca es silenciosa',
            )}
          >
            <TProse
              text={bi(
                'When a recommendation cannot lawfully reach you, it is downgraded to the same facts without the opinion — and you are told which output was withheld, the reason the gate returned, and what would change it. A person handed the downgraded version with no explanation cannot tell it apart from a bug, an empty database, or a product with nothing to say about their case.',
                'Cuando una recomendación no puede llegarle lícitamente, se degrada a los mismos hechos sin la opinión, y se le indica qué resultado se ha retenido, el motivo que devolvió el control y qué cambiaría eso. Quien recibe la versión degradada sin explicación no puede distinguirla de un error, de una base de datos vacía o de un producto que no tiene nada que decir sobre su caso.',
              )}
            />
            <TProse
              text={bi(
                'A downgrade is re-checked rather than trusted, so a downgrade that still returns a recommendation cannot walk past the boundary. Classification can move down; it never moves up. This is a differentiator, not a disclaimer: it is the reason the assessments this platform does release are worth relying on.',
                'La degradación se vuelve a comprobar en lugar de darse por buena, de modo que una degradación que siga devolviendo una recomendación no puede cruzar la frontera. La clasificación puede bajar; nunca sube. Esto es un rasgo diferencial, no un descargo de responsabilidad: es la razón por la que las evaluaciones que sí se entregan merecen confianza.',
              )}
            />
          </Callout>
        </Stack>
      </Section>

      <Section
        id="refused"
        title={bi('What we refuse to build', 'Lo que nos negamos a construir')}
        description={bi(
          'Two capabilities a competitor may well offer you. Both are refused permanently, and the refusal is in the code rather than in a policy page.',
          'Dos funcionalidades que un competidor podría ofrecerle. Ambas están rechazadas de forma permanente, y el rechazo está en el código y no en una página de políticas.',
        )}
      >
        <Stack gap="md">
          <Grid>
            <Card>
              <h3 className={styles.cardTitle}>
                <Badge
                  tone="bad"
                  label={bi('No custody of your credential', 'Sin custodia de su credencial')}
                />
              </h3>
              <TProse
                text={bi(
                  'Meridian does not accept, store, relay or transmit the authentication credential you use before your own government, and does not act before an authority while presenting as you. That credential is not a website login: it is the key that reaches your tax file, your social security record and your civil registry entries.',
                  'Meridian no acepta, almacena, retransmite ni transmite la credencial de autenticación que usted usa ante su propia administración, ni actúa ante una autoridad haciéndose pasar por usted. Esa credencial no es el acceso a una web: es la llave que alcanza su expediente fiscal, su historial de seguridad social y sus asientos del registro civil.',
                )}
              />
              <ul className={styles.list}>
                <li>
                  <T
                    text={bi(
                      'Holding it would make the operator a custodian for a state identity system — a role nobody involved has signed up for.',
                      'Custodiarla convertiría al operador en depositario de un sistema de identidad estatal, un papel que nadie de los implicados ha asumido.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'These schemes’ own terms treat the credential as personal and non-transferable.',
                      'Las propias condiciones de estos sistemas tratan la credencial como personal e intransferible.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'A breach of this platform would stop being a data incident and become an identity-fraud event against your tax, social security and civil registry records.',
                      'Una brecha en esta plataforma dejaría de ser un incidente de datos para convertirse en un fraude de identidad contra sus registros fiscales, de seguridad social y del registro civil.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'A filing made with your credential is legally your act, performed by someone else, with no record of your consent to that specific act on that specific day.',
                      'Una presentación hecha con su credencial es jurídicamente su acto, realizado por otro, sin constancia de su consentimiento a ese acto concreto en esa fecha concreta.',
                    )}
                  />
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className={styles.cardTitle}>
                <Badge
                  tone="ok"
                  label={bi('Assisted handoff instead', 'En su lugar, entrega asistida')}
                />
              </h3>
              <TProse
                text={bi(
                  'Meridian computes the values, assembles the documents, and hands you an ordered package you carry to the portal or the appointment yourself: the exact destination, the steps in sequence, which of your documents each step consumes, the field values already worked out for you to copy, and what you must bring back so the matter can continue.',
                  'Meridian calcula los valores, prepara la documentación y le entrega un paquete ordenado que usted mismo lleva al portal o a la cita: el destino exacto, los pasos en secuencia, qué documentos suyos consume cada paso, los valores de cada campo ya calculados para que los copie y lo que debe traer de vuelta para que el expediente continúe.',
                )}
              />
              <ul className={styles.list}>
                <li>
                  <T
                    text={bi(
                      'The legal act stays yours. You authenticate, you declare, you submit.',
                      'El acto jurídico sigue siendo suyo. Usted se autentica, usted declara, usted presenta.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'The audit trail lands in your account on the authority’s own system, where an authority will actually look for it.',
                      'El rastro de auditoría queda en su cuenta del propio sistema de la administración, que es donde una administración lo buscará.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'It survives the portal changing. Robotic submission breaks silently the week a form gains a field; a handoff degrades to a person reading a slightly different screen.',
                      'Sobrevive a los cambios del portal. La presentación robotizada se rompe en silencio la semana en que un formulario gana un campo; una entrega asistida se degrada a una persona leyendo una pantalla algo distinta.',
                    )}
                  />
                </li>
                <li>
                  <T
                    text={bi(
                      'Spanish administrative law reaches the same answer: Ley 39/2015 art. 12 provides for assistance in the use of electronic means, and contemplates acting for someone only through designated officials with their express recorded consent.',
                      'El derecho administrativo español llega a la misma conclusión: el art. 12 de la Ley 39/2015 prevé la asistencia en el uso de medios electrónicos y contempla actuar por otro solo a través de funcionarios habilitados y con su consentimiento expreso y registrado.',
                    )}
                  />
                </li>
              </ul>
            </Card>
          </Grid>

          <Callout
            tone="neutral"
            icon="◆"
            title={bi(
              'Also refused: any estimate of your chance of success',
              'También rechazado: cualquier estimación de su probabilidad de éxito',
            )}
          >
            <TProse
              text={bi(
                'It is a prediction of outcome, it is the most heavily regulated thing an unlicensed adviser can say, and no authority publishes the data that would make such a number true. A percentage invented to look authoritative is worse than silence, because it is acted on.',
                'Es una predicción de resultado, es lo más regulado que puede decir quien carece de licencia y ninguna autoridad publica los datos que harían cierta esa cifra. Un porcentaje inventado para parecer solvente es peor que el silencio, porque la gente actúa sobre él.',
              )}
            />
            <TProse
              text={bi(
                'The refusals above are enforced by the type system, a runtime guard on every untyped boundary, and repository checks that run in CI before anything else. They are not promises in a document; they are conditions the build has to satisfy.',
                'Los rechazos anteriores se imponen mediante el sistema de tipos, una comprobación en tiempo de ejecución en cada frontera no tipada y controles del repositorio que se ejecutan en CI antes que nada. No son promesas de un documento: son condiciones que la compilación debe cumplir.',
              )}
            />
          </Callout>
        </Stack>
      </Section>

      <Section
        id="status"
        title={bi('Where the build actually stands', 'En qué punto está realmente el desarrollo')}
        description={bi(
          'Counted from the catalog this site ships, at build time, as at the date below. Everything in this section is a fact about the repository rather than a plan.',
          'Contado sobre el catálogo que incluye este sitio, en tiempo de compilación y a la fecha indicada. Todo lo de esta sección es un hecho sobre el repositorio, no un plan.',
        )}
      >
        <Card tone="sunken">
          <Facts>
            <Fact label={bi('Pathways encoded', 'Vías codificadas')}>
              <Figure value={CATALOG.pathways} />
            </Fact>
            <Fact label={bi('Reviewed by counsel', 'Revisadas por letrado')}>
              <Figure value={`${CATALOG.counselReviewed} / ${CATALOG.pathways}`} />
              <div className={styles.factBadge}>
                <Badge
                  tone={NOTHING_IS_COUNSEL_REVIEWED ? 'warn' : 'ok'}
                  label={
                    NOTHING_IS_COUNSEL_REVIEWED
                      ? bi('None, today', 'Ninguna, a día de hoy')
                      : bi('Some reviewed', 'Algunas revisadas')
                  }
                />
              </div>
            </Fact>
            <Fact label={bi('Open to new applications', 'Abiertas a nuevas solicitudes')}>
              <Figure value={`${CATALOG.open} / ${CATALOG.pathways}`} />
            </Fact>
            <Fact label={bi('Distinct sources cited', 'Fuentes distintas citadas')}>
              <Figure value={CATALOG.citations} />
              <div className={styles.factNote}>
                <T
                  text={bi(
                    `${CATALOG.citationsWithUrl} carry a link we are confident is canonical`,
                    `${CATALOG.citationsWithUrl} llevan un enlace que consideramos canónico`,
                  )}
                />
              </div>
            </Fact>
            <Fact label={bi('Sources past the freshest band', 'Fuentes fuera de la banda más reciente')}>
              <Figure value={`${CATALOG.agingCitations} / ${CATALOG.citations}`} />
            </Fact>
            <Fact label={bi('Figures computed as at', 'Cifras calculadas a fecha de')}>
              <CivilDate value={CATALOG.asOf} />
            </Fact>
          </Facts>
        </Card>

        {/*
          Title and body both branch on the counted figure. The unreviewed state
          is the one that holds today, but it is not written as though it were
          permanent: the day a licensed person signs a record off, this callout
          has to stop saying nothing has been signed off, and it does so without
          anybody remembering to edit copy.
        */}
        <Callout
          tone={NOTHING_IS_COUNSEL_REVIEWED ? 'warn' : 'info'}
          icon={NOTHING_IS_COUNSEL_REVIEWED ? '!' : 'i'}
          title={
            NOTHING_IS_COUNSEL_REVIEWED
              ? bi(
                  'No pathway in this catalog has been reviewed by counsel',
                  'Ninguna vía de este catálogo ha sido revisada por letrado',
                )
              : bi(
                  'Only counsel-reviewed pathways can enter a recommendation',
                  'Solo las vías revisadas por letrado pueden formar parte de una recomendación',
                )
          }
        >
          <TProse
            text={bi(
              `${CATALOG.counselReviewed} of ${CATALOG.pathways} pathways carry a licensed sign-off; the rest ship marked unreviewed. An unreviewed pathway may be shown as a restatement of the sources it cites, and your own figures may be measured against it, but it may not be built into a recommendation: the ranking function excludes it and attaches the reason. That is the system working as designed, not a placeholder waiting to be tidied — sign-off is a workflow step with a named licensed human attached, not a constant somebody flips.`,
              `${CATALOG.counselReviewed} de ${CATALOG.pathways} vías cuentan con validación de una persona colegiada; el resto se publican marcadas como no revisadas. Una vía no revisada puede mostrarse como exposición de las fuentes que cita, y sus propias cifras pueden medirse frente a ella, pero no puede convertirse en una recomendación: la función de clasificación la excluye y adjunta el motivo. Así es como debe funcionar el sistema, no un marcador de posición pendiente de arreglar: la validación es un paso del flujo con una persona colegiada concreta detrás, no una constante que alguien cambia.`,
            )}
          />
          <TProse
            text={bi(
              `Of the ${CATALOG.citations} distinct sources cited, ${plural(CATALOG.discretionaryCitations, 'is', 'are')} marked as administrative practice rather than a statutory threshold. Those are surfaced as such wherever they are applied, instead of being presented as settled law.`,
              `De las ${CATALOG.citations} fuentes distintas citadas, ${CATALOG.discretionaryCitations} están marcadas como práctica administrativa y no como umbral legal. Se muestran como tales allí donde se aplican, en lugar de presentarse como derecho consolidado.`,
            )}
          />
        </Callout>

        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="ok" label={bi('Working today', 'Funciona hoy')} />
            </h3>
            <ul className={styles.list}>
              <li>
                <T
                  text={bi(
                    'Civil-date arithmetic with no timezone and no Date object anywhere in the stack.',
                    'Aritmética de fechas civiles sin zonas horarias y sin ningún objeto Date en toda la pila.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Presence ledger, Schengen 90/180, tax day counts, continuous residence and accumulated work.',
                    'Registro de presencia, Schengen 90/180, cómputo fiscal de días, residencia continuada y trabajo acumulado.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Machine-readable travel-document parsing and check-digit verification to ICAO Doc 9303.',
                    'Lectura de documentos de viaje de lectura mecánica y verificación de dígitos de control conforme al Doc 9303 de OACI.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'A declarative rules engine whose evaluator contains no country name and no threshold, plus the release gate described above.',
                    'Un motor de reglas declarativo cuyo evaluador no contiene ningún nombre de país ni ningún umbral, más el control de divulgación descrito arriba.',
                  )}
                />
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="warn" label={bi('Not built yet', 'Aún no construido')} />
            </h3>
            <ul className={styles.list}>
              <li>
                <T
                  text={bi(
                    'No account, no sign-in and no database in any of the applications. Nothing a reader enters is stored, because there is nowhere yet to store it.',
                    'Ninguna de las aplicaciones tiene cuenta, inicio de sesión ni base de datos. Nada de lo que introduzca quien lee se almacena, porque todavía no hay dónde almacenarlo.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'No government integration is provisioned. Nothing here files anything with anybody, and the adapters that would say otherwise report their own unavailability rather than inventing a response.',
                    'No hay ninguna integración pública aprovisionada. Nada de esto presenta nada ante nadie, y los adaptadores que podrían indicar lo contrario informan de su propia indisponibilidad en lugar de inventarse una respuesta.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Every screen renders from sample data declared in the application’s own source, and every figure on it is computed when the site is built rather than fetched from a service.',
                    'Cada pantalla se dibuja a partir de datos de ejemplo declarados en el propio código de la aplicación, y cada cifra se calcula al compilar el sitio en lugar de obtenerse de un servicio.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'None of the three applications has a test suite. The libraries underneath them do; the screens do not, and that is the largest gap in the repository.',
                    'Ninguna de las tres aplicaciones tiene pruebas. Las bibliotecas sobre las que se apoyan sí; las pantallas no, y esa es la mayor carencia del repositorio.',
                  )}
                />
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="bad" label={bi('Permanently refused', 'Rechazado de forma permanente')} />
            </h3>
            <ul className={styles.list}>
              <li>
                <T
                  text={bi(
                    'Custody of a government authentication credential, and acting before an authority while presenting as the user.',
                    'La custodia de una credencial de autenticación pública y actuar ante una autoridad haciéndose pasar por la persona usuaria.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Any estimate of the chance an application will succeed.',
                    'Cualquier estimación de la probabilidad de éxito de una solicitud.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Any recommendation drawn from rules nobody qualified has read.',
                    'Cualquier recomendación basada en normas que nadie cualificado haya leído.',
                  )}
                />
              </li>
              <li>
                <T
                  text={bi(
                    'Fixture data dressed as a government response. An adapter that cannot do something says so, with a reason and an owner.',
                    'Datos de prueba disfrazados de respuesta oficial. Un adaptador que no puede hacer algo lo dice, con un motivo y un responsable.',
                  )}
                />
              </li>
            </ul>
          </Card>
        </Grid>
      </Section>

      <Section
        id="audiences"
        title={bi('Who it is for', 'Para quién es')}
        description={bi(
          'The same engine, gated differently, because the regulator draws the line by who is accountable rather than by who is paying.',
          'El mismo motor, con distinto control, porque el regulador traza la línea según quién responde y no según quién paga.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Licensed firms and consultancies', 'Despachos y consultoras colegiados')} />
            </h3>
            <TProse
              text={bi(
                'A practitioner inside a firm gets every class of output, including the ranked comparison an applicant cannot be shown, because their licensee is accountable for the judgement and the engine is a tool in their hands. What they get is the arithmetic and the citations behind each figure, not a black box they would have to defend.',
                'Una persona profesional dentro de un despacho obtiene todas las clases de resultado, incluida la comparación ordenada que no puede mostrarse a un solicitante, porque su colegiado responde del criterio y el motor es una herramienta en sus manos. Lo que obtiene es la aritmética y las citas detrás de cada cifra, no una caja negra que tendría que defender.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Individuals', 'Particulares')} />
            </h3>
            <TProse
              text={bi(
                'You get your own day counts, your document sequence, and what each cited rule makes of your recorded facts — with the arithmetic shown. You do not get a recommendation unless a representative is attached to your matter, and where one is withheld the page names it rather than leaving a gap.',
                'Obtiene su propio cómputo de días, la secuencia de su documentación y qué dice de sus datos registrados cada norma citada, con la aritmética a la vista. No obtiene una recomendación salvo que haya un representante vinculado a su expediente, y cuando se retiene alguna la página lo indica en lugar de dejar un hueco.',
              )}
            />
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <T text={bi('Employers moving staff', 'Empresas que trasladan personal')} />
            </h3>
            <TProse
              text={bi(
                'Presence and document status for people you are relocating, on the same terms as the individual: information and assessment, and no recommendation unless a representative is on the matter. An employer is not a licensee, and the boundary does not move because the reader is a company.',
                'Presencia y estado documental de las personas que traslada, en las mismas condiciones que un particular: información y evaluación, y ninguna recomendación salvo que haya un representante en el expediente. Una empresa no es un colegiado, y la frontera no se mueve porque quien lee sea una sociedad.',
              )}
            />
          </Card>
        </Grid>

        <div className={styles.closing}>
          <ActionLink
            href={PORTAL_URL}
            variant="primary"
            label={bi('Open the applicant portal', 'Abrir el portal del solicitante')}
          />
          <ActionLink
            href={REPO_URL}
            newTab
            label={bi(
              'Read the source, including the catalog',
              'Ver el código fuente, catálogo incluido',
            )}
          />
        </div>
      </Section>
    </Page>
  );
}
