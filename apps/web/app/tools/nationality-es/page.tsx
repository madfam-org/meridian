/**
 * `/tools/nationality-es` — the Spanish nationality-by-residence criteria check.
 *
 * A server component that renders the framing and then hands off to
 * `NationalityTool`, which holds the interaction and runs the catalog's own
 * evaluator. The split is the same one `/tools/mrz` makes and for the same
 * reasons: `metadata` can only be exported from a server component, and keeping
 * the prose here means the JavaScript that ships to the browser is the part that
 * has to.
 *
 * Nothing on this route reads a request, a cookie, a header or a search
 * parameter, so Next prerenders it as static HTML. There is no server-side
 * handler that could receive an answer even by accident, and no route segment
 * config here opts out of that.
 *
 * The prose below states what the two regimes are and what this page will not
 * do. It names no threshold that is not in the catalog: every period, every
 * exemption and every citation the reader sees is read from
 * `@meridian/pathways` at the moment they press the button.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { bi } from '@/lib/i18n';
import { T, TInline, TProse } from '@/components/Bilingual';
import { Callout } from '@/components/Callout';
import { CoverageBoundary } from '@/components/CoverageBoundary';
import { Page, PageHeader, Section, Stack } from '@/components/Layout';

import { NationalityTool } from './NationalityTool';

export const metadata: Metadata = {
  title: 'Spanish nationality by residence — criteria check',
  description:
    'Measure your own answers against both residence regimes in art. 22 of the Spanish Civil ' +
    'Code — the two-year reduced period and the general ten years — criterion by criterion, ' +
    'with the provision behind each one. Runs entirely in your browser: nothing you answer is ' +
    'transmitted or stored.',
};

export default function NationalityEsToolPage() {
  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href="/tools">
            <TInline text={bi('Tools', 'Herramientas')} />
          </Link>
        }
        title={bi(
          'Spanish nationality by residence — criteria check',
          'Nacionalidad española por residencia — comprobación de criterios',
        )}
        lead={bi(
          'Art. 22 of the Civil Code sets two residence periods: ten years as the general rule, and two for nationals of the states it names. Which of them applies to a particular person turns on questions that a summary of the article does not ask — and getting one of them wrong is the difference between two years and ten. This page asks them, measures your answers against both regimes, and shows the provision behind every criterion.',
          'El art. 22 del Código Civil fija dos plazos de residencia: diez años como regla general y dos para los nacionales de los Estados que enumera. Cuál se aplica a una persona concreta depende de preguntas que un resumen del artículo no plantea, y equivocarse en una de ellas es la diferencia entre dos años y diez. Esta página las plantea, contrasta sus respuestas con ambos regímenes y muestra el precepto que respalda cada criterio.',
        )}
      />

      {/*
        Above the questions, not below the answer.

        This page asks about one route to one status in one country. A reader who
        does not qualify under it, or whose answers leave it undecided, has been
        told nothing whatsoever about the routes they might actually have — and
        the routes most people in Spain without status use are not in this
        catalog at all. Putting that after the form would mean the reader meets
        it only if they scroll past their own result, and the result is the
        moment the wrong conclusion gets drawn. `NationalityTool` carries the
        same statement inside the result panel for the same reason.
      */}
      <CoverageBoundary jurisdictions={['ES']} />

      <Section
        id="what-this-asks"
        title={bi(
          'The three questions a summary leaves out',
          'Las tres preguntas que un resumen omite',
        )}
      >
        <Stack gap="md">
          <TProse
            text={bi(
              'The list of countries in art. 22.1 is the part everybody quotes. These are the parts that decide the answer, and they are asked here because the catalog encodes them.',
              'La lista de países del art. 22.1 es la parte que todo el mundo cita. Estas son las partes que deciden la respuesta, y aquí se preguntan porque el catálogo las tiene codificadas.',
            )}
          />

          <Callout
            tone="info"
            icon="i"
            title={bi(
              'Whether the nationality is held by origin',
              'Si la nacionalidad se ostenta de origen',
            )}
          >
            <TProse
              text={bi(
                'Art. 22.1 confers the two-year period on nationals de origen. Somebody who acquired one of the listed nationalities later, by residence in that country, is on the ten-year general regime — the passport in their hand does not distinguish the two cases and the article does. The question is asked, and if it goes unanswered the reduced route is reported as undecided rather than as available.',
                'El art. 22.1 concede el plazo de dos años a los nacionales de origen. Quien adquirió después una de las nacionalidades enumeradas, por residencia en ese país, queda sujeto al régimen general de diez años: el pasaporte que tiene en la mano no distingue ambos casos y el precepto sí. La pregunta se formula, y si queda sin responder la vía reducida se informa como indeterminada y no como disponible.',
              )}
            />
          </Callout>

          <Callout
            tone="info"
            icon="i"
            title={bi(
              'Which nationality the residence is actually held under',
              'Bajo qué nacionalidad consta realmente la residencia',
            )}
          >
            <TProse
              text={bi(
                'Somebody holding both an Ibero-American and an EU nationality, who entered Spain and registered as an EU citizen, holds their residence under the EU one. On the catalog’s record of registry practice they cannot reach back for the reduction on the strength of the other passport. That treatment is administrative practice rather than a line of the Civil Code, the catalog marks it as such, and the result on this page repeats the caveat wherever the criterion is applied.',
                'Quien tiene una nacionalidad iberoamericana y otra de la UE, y entró en España inscribiéndose como ciudadano de la UE, ostenta su residencia bajo esta última. Según lo que el catálogo recoge de la práctica registral, no puede recuperar la reducción amparándose en el otro pasaporte. Ese criterio es práctica administrativa y no un artículo del Código Civil; el catálogo lo marca como tal y el resultado de esta página repite la advertencia allí donde se aplica.',
              )}
            />
          </Callout>

          <Callout
            tone="info"
            icon="i"
            title={bi(
              'What an unanswered question does',
              'Qué ocurre con una pregunta sin responder',
            )}
          >
            <TProse
              text={bi(
                'It produces "not recorded", which is a third finding alongside met and unmet, and it holds the route at "not decidable". It never becomes a failure and it never becomes a favourable guess. Every question on this page may be left blank, and leaving one blank costs you nothing except the certainty that question would have bought.',
                'Produce «sin datos», que es un tercer resultado junto a cumplido y no cumplido, y deja la vía en «no decidible». Nunca se convierte en un incumplimiento ni en una suposición favorable. Todas las preguntas de esta página pueden dejarse en blanco, y dejar una en blanco no le cuesta nada salvo la certeza que esa pregunta habría aportado.',
              )}
            />
          </Callout>
        </Stack>
      </Section>

      <Section
        id="what-this-is-not"
        title={bi('What this page will not tell you', 'Qué no le dirá esta página')}
      >
        <Stack gap="md">
          <TProse
            text={bi(
              'It will not say whether nationality would be granted. Art. 22.4 requires good civic conduct and a sufficient degree of integration into Spanish society, and neither is a threshold a program can measure — a clear police certificate is evidence toward the first, not the whole of it, and the assessment belongs to the authority. It will not tell you which regime to apply under: both are measured on every run and both are shown, in the order the catalog records them, because choosing between them for you would be a recommendation and no licensed person is accountable for one here.',
              'No dirá si se concedería la nacionalidad. El art. 22.4 exige buena conducta cívica y un grado suficiente de integración en la sociedad española, y ninguna de las dos es un umbral que un programa pueda medir: un certificado de antecedentes sin condenas es prueba de lo primero, no lo agota, y la valoración corresponde a la autoridad. Tampoco le dirá por qué régimen solicitar: ambos se evalúan en cada ejecución y ambos se muestran, en el orden en que los recoge el catálogo, porque elegir entre ellos por usted sería una recomendación y aquí no hay ninguna persona con licencia que responda de ella.',
            )}
          />

          <Callout
            tone="warn"
            icon="!"
            title={bi(
              'Nobody licensed has signed off on these rules',
              'Ninguna persona con licencia ha validado estas normas',
            )}
          >
            <TProse
              text={bi(
                'Both records this page uses are marked unreviewed in Meridian’s catalog, and that is their accurate state rather than a placeholder. The criteria and citations were written from the published sources; no licensed representative has read them and put their name to them. They are shown exactly as encoded — the rule, the comparison performed, and the source — so that you can check each one against the instrument yourself. The engine that would rank routes refuses to consider an unreviewed record at all, which is why this page ranks nothing.',
                'Los dos registros que utiliza esta página figuran como no revisados en el catálogo de Meridian, y ese es su estado real, no un marcador provisional. Los criterios y las citas se redactaron a partir de las fuentes publicadas; ningún representante con licencia los ha leído ni los ha firmado. Se muestran tal como están codificados —la norma, la comparación efectuada y la fuente— para que usted mismo pueda contrastar cada uno con el instrumento. El motor que ordenaría las vías se niega por completo a considerar un registro no revisado, y por eso esta página no ordena nada.',
              )}
            />
          </Callout>

          <p>
            <Link href="/pathways">
              <T
                text={bi(
                  'Read both records in the catalog, criterion by criterion',
                  'Consulte ambos registros del catálogo, criterio a criterio',
                )}
              />
            </Link>
          </p>
        </Stack>
      </Section>

      <NationalityTool />
    </Page>
  );
}
