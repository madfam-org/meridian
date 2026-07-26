import type { Metadata } from 'next';
import Link from 'next/link';

import { staleness } from '@meridian/core';
import { MERIDIAN_PATHWAY_CATALOG, isCounselReviewed, statusOn } from '@meridian/pathways';

import { bi, localizedPath, translator } from '@/lib/i18n';
import { alternatesFor, readLocale, type LocaleParams } from '@/lib/locale';
import { plural } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { SAMPLE_MATTERS } from '@/lib/sample/matters';
import { Badge, Chip } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import {
  Card,
  Facts,
  Fact,
  Figure,
  Grid,
  Page,
  PageHeader,
  Section,
  Stack,
} from '@/components/Layout';

import styles from './page.module.css';

/**
 * The portal's home page. The public explainer is a separate application —
 * `apps/landing`, on its own host — and this is what a person sees once they
 * have followed the link across.
 *
 * Every figure on this page is counted from the shipped catalog at build time.
 * There are no adoption numbers, no testimonials, no "trusted by" line and no
 * roadmap dressed as a feature list, because none of those would be true and a
 * platform that tells someone whether they have overstayed cannot afford to
 * spend its credibility on marketing.
 *
 * The "what is built" section gives the limits the same room as the
 * capabilities, and puts them on the same screen rather than below the fold.
 * Stating them here is cheaper than letting someone discover them while relying
 * on the product.
 */

const catalog = MERIDIAN_PATHWAY_CATALOG;

const jurisdictions = [...new Set(catalog.map((p) => p.jurisdiction))].sort();
const counselReviewed = catalog.filter(isCounselReviewed).length;
const openNow = catalog.filter((p) => statusOn(p, AS_OF) === 'open').length;
const criteriaCount = catalog.reduce((sum, p) => sum + p.criteria.length, 0);

const allCitations = catalog.flatMap((p) => p.citations);
const uniqueCitations = [...new Map(allCitations.map((x) => [x.id, x])).values()];
const discretionaryCount = uniqueCitations.filter((x) => x.discretionary === true).length;
const staleCount = uniqueCitations.filter((x) => staleness(x, AS_OF) !== 'fresh').length;

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  return { alternates: alternatesFor('/', locale) };
}

export default async function HomePage({ params }: { readonly params: Promise<LocaleParams> }) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const at = (path: string): string => localizedPath(path, locale);

  return (
    <Page>
      <PageHeader
        eyebrow={
          <>
            {/* No port, no hostname, no environment name. Where this build is
                answering from is not something the page can observe — it renders
                identically in a container, in `next dev` and in a static export
                — so any address printed here would be a guess, and the one that
                used to be printed here matched neither the container port nor
                the dev port. The browser's address bar already knows. */}
            <Chip>{t('Applicant portal', 'Portal del solicitante')}</Chip>
            <Chip>AGPL-3.0</Chip>
          </>
        }
        title={t(
          'Your own figures, measured against rules you can check',
          'Sus propias cifras, medidas frente a normas que usted puede comprobar',
        )}
        lead={t(
          'Meridian counts the days you have spent in each country, works out what each rule makes of them, and shows the arithmetic and the source behind every number. It is software, not a law firm, and where a rule is not a bright line it says so instead of rounding it into one.',
          'Meridian cuenta los días que ha pasado en cada país, determina qué dice cada norma sobre ellos y muestra la aritmética y la fuente detrás de cada cifra. Es software, no un despacho de abogados, y cuando una regla no es taxativa lo dice en lugar de convertirla en una cifra cerrada.',
        )}
      />

      <Section
        id="what-it-does"
        title={t('What it does', 'Qué hace')}
        description={t(
          'Four things, each of which produces a number or a verdict you can reconstruct by hand from what is on the screen.',
          'Cuatro cosas, cada una de las cuales produce una cifra o un resultado que puede reconstruir a mano a partir de lo que ve en pantalla.',
        )}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>{t('Counts your days', 'Cuenta sus días')}</h3>
            <p>
              {t(
                'A ledger of where you were, day by day, feeding the Schengen 90/180 allowance, tax day-count thresholds and continuous-residence tests. Entry and exit days both count, because that is what the rules say.',
                'Un registro de dónde estuvo, día a día, que alimenta la franquicia Schengen 90/180, los umbrales fiscales de días y las pruebas de residencia continuada. Los días de entrada y salida cuentan ambos, porque es lo que dicen las normas.',
              )}
            </p>
          </Card>
          <Card>
            <h3 className={styles.cardTitle}>
              {t('Measures you against the rules', 'Le mide frente a las normas')}
            </h3>
            <p>
              {t(
                'Each pathway is a list of criteria with a source attached. Where a fact is missing the answer is "not recorded", never "no" — an unfinished profile is not a refusal.',
                'Cada vía es una lista de criterios con su fuente. Cuando falta un dato la respuesta es «sin datos», nunca «no»: un perfil incompleto no es una denegación.',
              )}
            </p>
          </Card>
          <Card>
            <h3 className={styles.cardTitle}>
              {t('Sequences the paperwork', 'Ordena la documentación')}
            </h3>
            <p>
              {t(
                'Which document needs an apostille, which needs a sworn translation, and how long each one stays current — projected forward to the date you actually intend to file, not to today.',
                'Qué documento necesita apostilla, cuál necesita traducción jurada y cuánto tiempo sigue vigente cada uno, proyectado a la fecha en que realmente piensa presentar, no a hoy.',
              )}
            </p>
          </Card>
          <Card>
            <h3 className={styles.cardTitle}>{t('Shows its sources', 'Muestra sus fuentes')}</h3>
            <p>
              {t(
                'Every rule carries the instrument it comes from and the date a human last checked it. Where the figure is administrative practice rather than a statutory threshold, the page says that in place of the number.',
                'Cada norma lleva el instrumento del que procede y la fecha en que una persona lo contrastó por última vez. Cuando la cifra es práctica administrativa y no un umbral legal, la página lo dice en lugar de la cifra.',
              )}
            </p>
          </Card>
        </Grid>
      </Section>

      <Section
        id="catalog-state"
        title={t('The state of the rule catalog', 'Estado del catálogo de normas')}
        description={t(
          'Counted from the catalog this build ships, at build time. Nothing here is an estimate.',
          'Contado sobre el catálogo que incluye esta compilación, en tiempo de compilación. Nada de esto es una estimación.',
        )}
      >
        <Card tone="sunken">
          <Facts>
            <Fact label={t('Pathways encoded', 'Vías codificadas')}>
              <Figure value={catalog.length} unit={t('routes', 'vías')} />
            </Fact>
            <Fact label={t('Jurisdictions', 'Jurisdicciones')}>
              <Figure value={jurisdictions.length} />
              {/* ISO country codes are not translated, so they are rendered once
                  rather than through the bilingual pair, which would repeat them. */}
              <div className={styles.factCodes}>{jurisdictions.join(', ')}</div>
            </Fact>
            <Fact label={t('Open to new applications', 'Abiertas a nuevas solicitudes')}>
              <Figure value={`${openNow} / ${catalog.length}`} />
            </Fact>
            <Fact label={t('Eligibility criteria', 'Criterios de elegibilidad')}>
              <Figure value={criteriaCount} />
            </Fact>
            <Fact label={t('Distinct sources cited', 'Fuentes distintas citadas')}>
              <Figure value={uniqueCitations.length} />
            </Fact>
            <Fact label={t('Reviewed by counsel', 'Revisadas por letrado')}>
              <Figure value={`${counselReviewed} / ${catalog.length}`} />
              <div className={styles.factBadge}>
                <Badge
                  tone={counselReviewed === 0 ? 'warn' : 'ok'}
                  label={t(
                    counselReviewed === 0
                      ? bi('None, today', 'Ninguna, a día de hoy')
                      : bi('Some reviewed', 'Algunas revisadas'),
                  )}
                />
              </div>
            </Fact>
          </Facts>
        </Card>

        {/* Title and body both branch on the counted figure rather than
            asserting the state that happens to hold today. The moment a
            licensed person signs a record off, this callout has to stop saying
            nothing has been signed off — and it does, without anybody
            remembering that a sentence needs editing. */}
        <Callout
          tone={counselReviewed === 0 ? 'warn' : 'info'}
          icon={counselReviewed === 0 ? '!' : 'i'}
          title={t(
            counselReviewed === 0
              ? bi(
                  'No rule in this catalog has been signed off by a licensed person',
                  'Ninguna norma de este catálogo ha sido validada por una persona con licencia',
                )
              : bi(
                  'Only signed-off rules can be built into a recommendation',
                  'Solo las normas validadas pueden formar parte de una recomendación',
                ),
          )}
        >
          <p>
            {t(
              `${counselReviewed} of ${catalog.length} pathways carry a licensed sign-off; the rest carry reviewStatus "unreviewed". An unreviewed pathway may be shown as a restatement of the sources it cites, and your own figures may be measured against it, but it may not be built into a recommendation. That is the intended live state, not an oversight waiting to be tidied — counsel sign-off is a workflow step with a named human attached, not a constant somebody flips.`,
              `${counselReviewed} de ${catalog.length} vías cuentan con validación de una persona con licencia; el resto llevan reviewStatus «unreviewed». Una vía no revisada puede mostrarse como exposición de las fuentes que cita, y sus propias cifras pueden medirse frente a ella, pero no puede convertirse en una recomendación. Ese es el estado real previsto, no un descuido pendiente de arreglar: la validación por letrado es un paso del flujo con una persona concreta detrás, no una constante que alguien cambia.`,
            )}
          </p>
          <p>
            {t(
              `Of the ${uniqueCitations.length} distinct sources cited, ${plural(discretionaryCount, 'is', 'are')} marked as administrative practice rather than a statutory threshold, and ${staleCount === 0 ? 'none has aged past its verification window' : `${plural(staleCount, 'has', 'have')} aged past the freshest verification band`}.`,
              `De las ${uniqueCitations.length} fuentes distintas citadas, ${discretionaryCount} están marcadas como práctica administrativa y no como umbral legal, y ${staleCount === 0 ? 'ninguna ha superado su ventana de verificación' : `${staleCount} han superado la banda de verificación más reciente`}.`,
            )}
          </p>
        </Callout>
      </Section>

      <Section
        id="regulatory-posture"
        title={t('Where the line is', 'Dónde está la línea')}
        description={t(
          'Meridian is software. Regulated advice requires an authorised representative attached to the matter, and the platform enforces that in the type system rather than in a disclaimer.',
          'Meridian es software. El asesoramiento reservado exige un representante autorizado vinculado al expediente, y la plataforma lo impone en el sistema de tipos y no en un descargo de responsabilidad.',
        )}
      >
        <Stack gap="md">
          <p>
            {t(
              'Under s.91 of Canada’s Immigration and Refugee Protection Act, advising or representing a person for consideration in connection with an application is an offence unless the adviser is a lawyer, a Quebec notary, or a licensee of the College of Immigration and Citizenship Consultants. Spain has its own reserved-activity rules for legal advice. A platform that tells an unrepresented paying consumer which route to take is not shipping a feature; it is committing an offence on behalf of its operator.',
              'Conforme al art. 91 de la Immigration and Refugee Protection Act de Canadá, asesorar o representar a una persona a cambio de contraprestación en relación con una solicitud es delito salvo que quien asesora sea abogado, notario de Quebec o colegiado del College of Immigration and Citizenship Consultants. España tiene sus propias reglas de actividad reservada para el asesoramiento jurídico. Una plataforma que dice a un consumidor sin representación y de pago qué vía tomar no está lanzando una funcionalidad: está cometiendo una infracción por cuenta de quien la explota.',
            )}
          </p>
          <p>
            {t(
              'So Meridian classifies every output where it is produced, not where it is displayed. Stating what a rule says is information. Measuring your own recorded facts against that rule and showing the arithmetic is an assessment. Ranking your options, or saying which one to pursue, is advice — and advice is gated. It can be downgraded, and you are told exactly what was removed and why. It is never quietly suppressed, and it is never upgraded.',
              'Por eso Meridian clasifica cada resultado donde se produce, no donde se muestra. Exponer lo que dice una norma es información. Medir sus propios datos registrados frente a esa norma y mostrar la aritmética es una evaluación. Clasificar sus opciones, o decir cuál seguir, es asesoramiento, y el asesoramiento está sujeto a control. Puede degradarse, y se le indica exactamente qué se ha retirado y por qué. Nunca se suprime en silencio, y nunca se eleva.',
            )}
          </p>

          <DisclosureNotice
            locale={locale}
            shown="information"
            withheld={[
              bi(
                'This page states what the rules are. It does not measure them against anybody, because it has nobody’s facts.',
                'Esta página expone cuáles son las normas. No las mide frente a nadie, porque no dispone de los datos de nadie.',
              ),
            ]}
          />
        </Stack>
      </Section>

      <Section
        id="built"
        title={t('What is built, and what is not', 'Qué está construido y qué no')}
      >
        <Grid>
          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="ok" label={t('Working today', 'Funciona hoy')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'Civil-date arithmetic with no timezone and no Date object anywhere in the stack.',
                  'Aritmética de fechas civiles sin zonas horarias y sin ningún objeto Date en toda la pila.',
                )}
              </li>
              <li>
                {t(
                  'Presence ledger with Schengen 90/180, tax day counts and continuous-residence assessment.',
                  'Registro de presencia con Schengen 90/180, cómputo fiscal de días y evaluación de residencia continuada.',
                )}
              </li>
              <li>
                {t(
                  'A declarative rules engine whose evaluator contains no country name and no threshold.',
                  'Un motor de reglas declarativo cuyo evaluador no contiene ningún nombre de país ni ningún umbral.',
                )}
              </li>
              <li>
                {t(
                  'The advice boundary, enforced by the release gate this portal actually calls.',
                  'La frontera del asesoramiento, impuesta por el control de divulgación que este portal invoca realmente.',
                )}
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="warn" label={t('Not built yet', 'Aún no construido')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'No account, no sign-in and no database. Nothing you see is stored, because there is nothing yet to store it in.',
                  'Sin cuenta, sin inicio de sesión y sin base de datos. Nada de lo que ve se almacena, porque todavía no hay dónde almacenarlo.',
                )}
              </li>
              <li>
                {t(
                  'No document upload and no passport scanning in this portal.',
                  'Sin carga de documentos ni lectura de pasaportes en este portal.',
                )}
              </li>
              <li>
                {t(
                  'No connection to any government system. Nothing here files anything with anybody.',
                  'Sin conexión a ningún sistema público. Nada de lo que hay aquí presenta nada ante nadie.',
                )}
              </li>
              <li>
                {t(
                  'The document routing on the documents page is computed inside this portal from a deliberately tiny rule set, because the shared documents engine is not wired in yet. The page says so where it matters.',
                  'El enrutado documental de la página de documentos se calcula dentro de este portal a partir de un conjunto de reglas deliberadamente mínimo, porque el motor documental compartido aún no está conectado. La página lo indica donde procede.',
                )}
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>
              <Badge tone="bad" label={t('Permanently refused', 'Rechazado de forma permanente')} />
            </h3>
            <ul className={styles.list}>
              <li>
                {t(
                  'Meridian will not hold your government authentication credential — no Cl@ve PIN, no portal password, no e.firma key — and will not act before an authority while presenting as you. The refusal is in the type system, not in a policy page.',
                  'Meridian no custodiará su credencial de autenticación pública —ni PIN de Cl@ve, ni contraseña de portal, ni clave de e.firma— ni actuará ante una administración haciéndose pasar por usted. El rechazo está en el sistema de tipos, no en una página de políticas.',
                )}
              </li>
              <li>
                {t(
                  'No estimate of the chance an application will succeed. It is a prediction of outcome, it is the most heavily regulated thing an unlicensed adviser can say, and no authority publishes the data that would make such a number true.',
                  'Ninguna estimación de la probabilidad de éxito de una solicitud. Es una predicción de resultado, es lo más regulado que puede decir quien no tiene licencia, y ninguna autoridad publica los datos que harían cierta esa cifra.',
                )}
              </li>
              <li>
                {t(
                  'No recommendation drawn from rules nobody qualified has read.',
                  'Ninguna recomendación basada en normas que nadie cualificado haya leído.',
                )}
              </li>
            </ul>
          </Card>
        </Grid>
      </Section>

      <Section
        id="explore"
        title={t('Look around', 'Eche un vistazo')}
        description={t(
          `The portal ships ${plural(SAMPLE_MATTERS.length, 'worked example', 'worked examples')}: invented people with invented histories, run through the real engines. Every page carries a banner saying so.`,
          `El portal incluye ${SAMPLE_MATTERS.length} ejemplos resueltos: personas inventadas con historiales inventados, procesados por los motores reales. Todas las páginas llevan un aviso que lo indica.`,
        )}
      >
        <Grid>
          <Link href={at('/matters')} className={styles.navCard}>
            <span className={styles.navCardTitle}>{t('Matters', 'Expedientes')}</span>
            <span className={styles.navCardBody}>
              {t(
                'Phase timeline, the sequential task list with every lock explained, day counters and the document checklist.',
                'Cronología de fases, lista secuencial de tareas con cada bloqueo explicado, cómputo de días y lista de documentos.',
              )}
            </span>
          </Link>
          <Link href={at('/pathways')} className={styles.navCard}>
            <span className={styles.navCardTitle}>{t('Pathways', 'Vías')}</span>
            <span className={styles.navCardBody}>
              {t(
                'The rule catalog itself: criteria, sources, verification dates, and the review status of every record.',
                'El propio catálogo de normas: criterios, fuentes, fechas de verificación y estado de revisión de cada registro.',
              )}
            </span>
          </Link>
        </Grid>
      </Section>
    </Page>
  );
}
