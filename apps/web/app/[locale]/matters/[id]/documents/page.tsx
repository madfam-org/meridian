import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, translator } from '@/lib/i18n';
import { readLocale, type LocaleParams } from '@/lib/locale';
import { days } from '@/lib/ui';
import { AS_OF } from '@/lib/sample/common';
import { sampleMatterById } from '@/lib/sample/matters';
import { documentScopeFor } from '@/lib/sample/documents';
import { buildChecklist, type ChecklistItem } from '@/lib/checklist';
import {
  DOCUMENT_KIND_LABEL,
  FRESHNESS_LABEL,
  TRANSLATION_STANDARD_LABEL,
  type FreshnessVerdict,
  type LegalisationRoute,
} from '@/lib/document-rules';
import { resolveCitations } from '@/lib/citations';
import { Badge, Chip } from '@/components/Badge';
import type { Tone } from '@/components/Badge';
import { Callout } from '@/components/Callout';
import { CitationList, CitationRefs } from '@/components/Citations';
import { DisclosureNotice } from '@/components/DisclosureNotice';
import { Card, CivilDate, Facts, Fact, Figure, Section, Stack } from '@/components/Layout';

import styles from './documents.module.css';

interface MatterParams extends LocaleParams {
  readonly id: string;
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<MatterParams>;
}): Promise<Metadata> {
  const locale = await readLocale(params);
  const { id } = await params;
  const t = translator(locale);
  const sample = sampleMatterById(id);
  const heading = t('Documents', 'Documentos');
  return {
    title: sample === null ? heading : `${heading} — ${t(sample.name)}`,
  };
}

const LEGALISATION_LABEL: Record<LegalisationRoute, Bi> = {
  none: bi('No legalisation needed', 'No requiere legalización'),
  apostille: bi('Apostille required', 'Requiere apostilla'),
  consular: bi('Consular legalisation required', 'Requiere legalización consular'),
  unknown: bi('Route not resolved', 'Vía sin resolver'),
};

const LEGALISATION_TONE: Record<LegalisationRoute, Tone> = {
  none: 'ok',
  apostille: 'info',
  consular: 'info',
  unknown: 'warn',
};

const FRESHNESS_TONE: Record<FreshnessVerdict, Tone> = {
  valid: 'ok',
  expires_before_submission: 'bad',
  already_expired: 'bad',
  unknown: 'warn',
};

function ItemCard({ item, locale }: { readonly item: ChecklistItem; readonly locale: Locale }) {
  const t = translator(locale);
  const { requirement, held, legalisation, translation, freshness } = item;

  return (
    <Card>
      <div className={styles.itemHead}>
        <div className={styles.itemIdentity}>
          <h3 className={styles.itemTitle}>{t(DOCUMENT_KIND_LABEL[requirement.kind])}</h3>
          <p className={styles.itemMeta}>
            <Chip>{`Issued in ${requirement.issuingCountry}`}</Chip>
            {item.citationIds.length > 0 ? <CitationRefs ids={item.citationIds} /> : null}
          </p>
        </div>
        <div className={styles.itemBadges}>
          {held === null ? (
            <Badge tone="bad" label={t('Not on file', 'No consta')} />
          ) : (
            <Badge tone="ok" label={t('On file', 'Consta')} />
          )}
        </div>
      </div>

      <p className={styles.criterion}>{t(requirement.criterion)}</p>

      {held !== null ? (
        <Facts>
          <Fact label={t('Issued', 'Expedido')}>
            {held.issuedOn === undefined ? (
              <span className={styles.muted}>{t('Not recorded', 'Sin registrar')}</span>
            ) : (
              <CivilDate value={held.issuedOn} />
            )}
          </Fact>
          <Fact label={t('Expires', 'Caduca')}>
            {held.expiresOn === undefined ? (
              <span className={styles.muted}>{t('Not recorded', 'Sin registrar')}</span>
            ) : (
              <CivilDate value={held.expiresOn} />
            )}
          </Fact>
          <Fact label={t('Language', 'Idioma')}>
            <code className={styles.code}>{held.language}</code>
          </Fact>
        </Facts>
      ) : null}

      <div className={styles.routing}>
        <section className={styles.routingBlock}>
          <h4 className={styles.routingTitle}>{t('Legalisation', 'Legalización')}</h4>
          <Badge
            tone={LEGALISATION_TONE[legalisation.route]}
            label={t(LEGALISATION_LABEL[legalisation.route])}
          />
          <p className={styles.rationale}>{t(legalisation.rationale)}</p>
          {legalisation.route !== 'none' && legalisation.route !== 'unknown' ? (
            <p className={styles.progress}>
              {item.legalisationDone ? (
                <Badge tone="ok" label={t('Done', 'Hecha')} />
              ) : (
                <Badge tone="warn" label={t('Outstanding', 'Pendiente')} />
              )}
            </p>
          ) : null}
        </section>

        <section className={styles.routingBlock}>
          <h4 className={styles.routingTitle}>{t('Translation', 'Traducción')}</h4>
          <Badge
            tone={
              translation.standard === 'unknown' ? 'warn' : translation.required ? 'info' : 'ok'
            }
            label={t(TRANSLATION_STANDARD_LABEL[translation.standard])}
          />
          <p className={styles.rationale}>{t(translation.rationale)}</p>
          {translation.required && translation.standard !== 'unknown' ? (
            <p className={styles.progress}>
              {item.translationDone ? (
                <Badge tone="ok" label={t('Done', 'Hecha')} />
              ) : (
                <Badge tone="warn" label={t('Outstanding', 'Pendiente')} />
              )}
            </p>
          ) : null}
        </section>

        <section className={styles.routingBlock}>
          <h4 className={styles.routingTitle}>
            {t('Currency at submission', 'Vigencia en la presentación')}
          </h4>
          <Badge
            tone={FRESHNESS_TONE[freshness.verdict]}
            label={t(FRESHNESS_LABEL[freshness.verdict])}
          />
          <p className={styles.rationale}>{t(freshness.rationale)}</p>
          {freshness.acceptableUntil !== null ? (
            <p className={styles.freshnessDetail}>
              {t('Acceptable until', 'Admisible hasta')}{' '}
              <CivilDate value={freshness.acceptableUntil} />
              {freshness.marginDays !== null ? (
                <span className={styles.margin}>
                  {' '}
                  (
                  {freshness.marginDays >= 0
                    ? t(
                        `${days(freshness.marginDays, 'en')} of margin`,
                        `${days(freshness.marginDays, 'es')} de margen`,
                      )
                    : t(
                        `${days(Math.abs(freshness.marginDays), 'en')} short`,
                        `${days(Math.abs(freshness.marginDays), 'es')} de retraso`,
                      )}
                  )
                </span>
              ) : null}
            </p>
          ) : null}
          {freshness.obtainNoEarlierThan !== null ? (
            <p className={styles.freshnessDetail}>
              {t('Order it no earlier than', 'No lo solicite antes del')}{' '}
              <CivilDate value={freshness.obtainNoEarlierThan} />
              <span className={styles.hint}>
                {' — '}
                {t(
                  'ordering it before that date wastes the fee, because it will have aged out by the filing date.',
                  'solicitarlo antes de esa fecha malgasta la tasa, porque habrá caducado en la fecha de presentación.',
                )}
              </span>
            </p>
          ) : null}
        </section>
      </div>
    </Card>
  );
}

export default async function DocumentsPage({
  params,
}: {
  readonly params: Promise<MatterParams>;
}) {
  const locale = await readLocale(params);
  const t = translator(locale);
  const { id } = await params;
  const sample = sampleMatterById(id);
  if (sample === null) notFound();

  const scope = documentScopeFor(sample.matter.id);
  if (scope === null) notFound();

  const checklist = buildChecklist(scope, sample.targetSubmissionDate, AS_OF);
  const resolved = resolveCitations(
    checklist.items.flatMap((i) => i.citationIds),
    null,
  );

  return (
    <>
      <Section id="documents-scope" title={t('What this page is', 'Qué es esta página')}>
        <Callout
          tone="info"
          icon="i"
          title={t(
            'Computed in the portal, not by the shared documents engine',
            'Calculado en el portal, no por el motor documental compartido',
          )}
        >
          <p>
            {t(
              'Meridian has a documents engine that owns legalisation routing, translation requirements and acceptance windows. It is not connected to this portal yet, so the routing below is computed here from a deliberately tiny rule set: one acceptance window, and legalisation modelled for one receiving state. Everything outside that resolves to "not resolved" and is handed to a person, never to a plausible default.',
              'Meridian tiene un motor documental que gestiona el enrutado de legalizaciones, los requisitos de traducción y los plazos de aceptación. Todavía no está conectado a este portal, así que el enrutado que sigue se calcula aquí a partir de un conjunto de reglas deliberadamente mínimo: una ventana de aceptación y la legalización modelada para un solo Estado receptor. Todo lo que quede fuera se resuelve como «sin resolver» y se remite a una persona, nunca a un valor por defecto plausible.',
            )}
          </p>
          <p>
            {t(
              'What is fully real here is the calendar arithmetic. Windows keep their own unit — three months is applied as three months and never as ninety days, because the two disagree by up to three days and always in the direction that makes a document look fresher than it is.',
              'Lo que sí es plenamente real aquí es la aritmética de calendario. Las ventanas conservan su unidad: tres meses se aplican como tres meses y nunca como noventa días, porque ambos difieren hasta en tres días y siempre en la dirección que hace parecer más reciente un documento de lo que es.',
            )}
          </p>
        </Callout>

        <Card tone="sunken">
          <Facts>
            <Fact label={t('Filing with', 'Se presenta ante')}>
              <Chip>{checklist.receivingCountry}</Chip>
            </Fact>
            <Fact label={t('Target submission date', 'Fecha objetivo de presentación')}>
              <CivilDate value={checklist.submissionDate} />
              <div className={styles.factNote}>
                {t(
                  'Every currency check below is projected to this date, not to today. A today-only check passes silently on exactly the document that will have aged out by the time anyone looks at the file.',
                  'Todas las comprobaciones de vigencia se proyectan a esta fecha, no a hoy. Una comprobación solo a día de hoy pasa en silencio precisamente el documento que habrá caducado cuando alguien revise el expediente.',
                )}
              </div>
            </Fact>
            <Fact label={t('Items required', 'Elementos exigidos')}>
              <Figure value={checklist.items.length} />
            </Fact>
            <Fact label={t('File ready to lodge', 'Expediente listo para presentar')}>
              <Badge
                tone={checklist.complete ? 'ok' : 'warn'}
                label={t(checklist.complete ? bi('Yes', 'Sí') : bi('Not yet', 'Todavía no'))}
              />
            </Fact>
          </Facts>
        </Card>
      </Section>

      <Section
        id="documents-attention"
        title={t('What needs attention', 'Qué requiere atención')}
        description={t(
          'Each bucket is separate on purpose. "Not checked" and "checked and fine" must never render the same way, because a reader who cannot tell them apart will treat both as done.',
          'Cada bloque va por separado a propósito. «Sin comprobar» y «comprobado y correcto» nunca deben mostrarse igual, porque quien no pueda distinguirlos tratará ambos como resueltos.',
        )}
      >
        <Stack gap="md">
          <AttentionBucket
            locale={locale}
            tone="bad"
            title={t('Not on file', 'No constan')}
            empty={t('Every required item is on file.', 'Todos los elementos exigidos constan.')}
            items={checklist.missing}
          />
          <AttentionBucket
            locale={locale}
            tone="bad"
            title={t('Out of date by the filing date', 'Caducados a la fecha de presentación')}
            empty={t(
              'Nothing on file will have aged out by the target submission date.',
              'Nada de lo que consta habrá caducado en la fecha objetivo de presentación.',
            )}
            items={checklist.outOfDate}
          />
          <AttentionBucket
            locale={locale}
            tone="warn"
            title={t('Currency never checked', 'Vigencia nunca comprobada')}
            empty={t(
              'Every item on file has a currency rule behind it.',
              'Todos los elementos que constan tienen una regla de vigencia detrás.',
            )}
            items={checklist.currencyUnchecked}
          />
          <AttentionBucket
            locale={locale}
            tone="warn"
            title={t('Routing a person must confirm', 'Enrutado que debe confirmar una persona')}
            empty={t(
              'Every route resolved from an encoded rule.',
              'Todas las vías se resolvieron a partir de una regla codificada.',
            )}
            items={checklist.unverifiedRouting}
          />
          <AttentionBucket
            locale={locale}
            tone="info"
            title={t('Legalisation outstanding', 'Legalización pendiente')}
            empty={t(
              'No legalisation step is outstanding on anything held.',
              'No queda ningún trámite de legalización pendiente sobre lo que consta.',
            )}
            items={checklist.awaitingLegalisation}
          />
          <AttentionBucket
            locale={locale}
            tone="info"
            title={t('Translation outstanding', 'Traducción pendiente')}
            empty={t(
              'No translation step is outstanding on anything held.',
              'No queda ninguna traducción pendiente sobre lo que consta.',
            )}
            items={checklist.awaitingTranslation}
          />
        </Stack>
      </Section>

      <Section
        id="documents-checklist"
        title={t('The checklist', 'La lista de documentos')}
        description={t(
          'Legalisation is sequenced before translation throughout. An apostille is itself a certificate bearing text that normally has to be translated with the document, so translating first means paying the sworn translator twice.',
          'La legalización va siempre antes que la traducción. La apostilla es a su vez una certificación con texto que normalmente debe traducirse junto con el documento, de modo que traducir primero supone pagar dos veces al traductor jurado.',
        )}
      >
        <Stack gap="md">
          {checklist.items.map((item) => (
            <ItemCard locale={locale} key={item.requirement.key} item={item} />
          ))}
        </Stack>
      </Section>

      <Section
        id="documents-disclosure"
        title={t('What these requirements are', 'Qué son estos requisitos')}
      >
        <DisclosureNotice
          locale={locale}
          shown="assessment"
          withheld={[
            bi(
              'Any statement that this file is ready to succeed, or that a missing item is fatal to it. The checklist reports what is present and what each routing rule makes of it.',
              'Cualquier afirmación de que este expediente esté listo para prosperar, o de que la falta de un elemento sea determinante. La lista informa de lo que consta y de lo que cada regla de enrutado dice al respecto.',
            ),
            bi(
              'The list of documents a particular office demands. Meridian encodes routing rules with a source; the shape of an office’s own checklist is set by that office, and the items above come from this worked example rather than from a cited instrument.',
              'La lista de documentos que exige una oficina concreta. Meridian codifica con fuente las reglas de enrutado; la forma de la lista de una oficina la fija esa oficina, y los elementos anteriores proceden de este ejemplo resuelto y no de un instrumento citado.',
            ),
          ]}
        />
      </Section>

      <Section
        id="documents-sources"
        title={t('Sources', 'Fuentes')}
        description={t(
          'The routing rules applied above. Several carry no canonical link: the catalog omits a URL rather than guess one, because a wrong gazette reference points at a different law and teaches the reader to stop checking.',
          'Las reglas de enrutado aplicadas arriba. Varias no llevan enlace canónico: el catálogo omite la URL en lugar de suponerla, porque una referencia errónea al boletín apunta a otra norma y enseña al lector a dejar de comprobar.',
        )}
      >
        <CitationList locale={locale} citations={resolved.found} asOf={AS_OF} />
      </Section>
    </>
  );
}

function AttentionBucket({
  tone,
  title,
  empty,
  items,
  locale,
}: {
  readonly tone: Tone;
  readonly title: string;
  readonly empty: string;
  readonly items: readonly ChecklistItem[];
  readonly locale: Locale;
}) {
  const t = translator(locale);
  if (items.length === 0) {
    return (
      <div className={styles.bucket}>
        <h3 className={styles.bucketTitle}>
          <Badge tone="ok" label={title} />
          <span className={styles.bucketCount}>0</span>
        </h3>
        <p className={styles.bucketEmpty}>{empty}</p>
      </div>
    );
  }

  return (
    <div className={styles.bucket}>
      <h3 className={styles.bucketTitle}>
        <Badge tone={tone} label={title} />
        <span className={styles.bucketCount}>{items.length}</span>
      </h3>
      <ul className={styles.bucketList}>
        {items.map((item) => (
          <li key={item.requirement.key}>
            {t(DOCUMENT_KIND_LABEL[item.requirement.kind])}
            <span className={styles.bucketOrigin}> · {item.requirement.issuingCountry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
