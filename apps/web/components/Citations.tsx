import type { Citation, IsoDate, SourceKind } from '@meridian/core';
import { citationAgeDays, staleness } from '@meridian/core';

import type { Bi, Locale } from '@/lib/i18n';
import { bi, instrumentLang, translator } from '@/lib/i18n';
import { agedDays } from '@/lib/ui';
import { Badge, Chip, PlainBadge } from '@/components/Badge';
import { stalenessView } from '@/lib/status';

import styles from './Citations.module.css';

/**
 * Legal provenance, rendered.
 *
 * Every rule this portal applies to a person carries a `Citation`, and the
 * citation is shown rather than footnoted away. Three fields drive the design:
 *
 * `verifiedOn` is when a *human* last read the cited text against its source,
 * not when the record was written. It is shown with its age and a freshness
 * band, because immigration law moves fast enough that a citation nobody has
 * re-read in six months should not be trusted silently — Spain repealed its
 * investor-residency route with roughly three months' notice.
 *
 * `discretionary` marks a rule that is administrative practice, a screening
 * criterion, or a published operational equivalence rather than statutory text.
 * Where it is set, this component refuses to let the number stand alone: the
 * caveat is rendered at the same visual weight as the rule.
 *
 * `url` is optional and is often absent on purpose. The catalog omits a link
 * rather than guess one, because a wrong canonical link teaches the reader to
 * stop checking.
 *
 * ## The instrument name is never translated
 *
 * `instrument` and `provision` are the *identity of the source*, not prose about
 * it. Rendering "Civil Code, art. 22.1" to an English reader is not a
 * translation but a mis-citation: it names an instrument that does not exist
 * under that title, and a person who tries to verify it — or a lawyer who tries
 * to rely on it — will not find it. So both render verbatim in every locale,
 * whatever language the page around them is in.
 *
 * That leaves the accessibility problem this design has to solve rather than
 * ignore: a Spanish page quoting "Immigration and Refugee Protection Act" would
 * have a screen reader pronounce English words with Spanish phonetics. The name
 * therefore carries its own `lang`, matching the instrument rather than the
 * page — `instrumentLang` derives it from the citation, returning `null` where
 * it cannot be determined without guessing, in which case no claim is made at
 * all. An English page marks "Código Civil (España)" as `es` and a Spanish page
 * marks "Immigration and Refugee Protection Act" as `en`; both directions are
 * correct, which is why the function takes no locale.
 */

const KIND_LABEL: Record<SourceKind, Bi> = {
  treaty: bi('Treaty or convention', 'Tratado o convenio'),
  statute: bi('Statute', 'Ley'),
  regulation: bi('Regulation', 'Reglamento'),
  policy: bi('Binding policy', 'Instrucción vinculante'),
  case_law: bi('Case law', 'Jurisprudencia'),
  official_guidance: bi('Official guidance', 'Guía oficial'),
  statistics: bi('Official statistics', 'Estadística oficial'),
  secondary: bi('Secondary source', 'Fuente secundaria'),
};

export function citationAnchor(id: string): string {
  return `cite-${id}`;
}

/** An inline reference that jumps to the full entry further down the page. */
export function CitationRef({ id }: { readonly id: string }) {
  return (
    <a className={styles.ref} href={`#${citationAnchor(id)}`}>
      <span aria-hidden="true">§</span>
      <span className={styles.refId}>{id}</span>
    </a>
  );
}

export function CitationRefs({ ids }: { readonly ids: readonly string[] }) {
  if (ids.length === 0) return null;
  return (
    <span className={styles.refs}>
      {ids.map((id) => (
        <CitationRef key={id} id={id} />
      ))}
    </span>
  );
}

/**
 * The instrument's name and provision, marked with the instrument's own
 * language.
 *
 * `<cite>` is the correct element for the title of a work, and it is what a
 * reader copying a reference out of the page will land on. `lang` is omitted
 * entirely — rather than defaulted to the page locale — when `instrumentLang`
 * declines to answer, because an unmarked run inherits the document language and
 * makes no claim, while a confidently wrong `lang` mispronounces a statute.
 */
export function InstrumentName({ citation }: { readonly citation: Citation }) {
  const lang = instrumentLang(citation) ?? undefined;
  return (
    <cite className={styles.instrumentName} lang={lang}>
      {citation.instrument}
      {citation.provision !== undefined ? (
        <span className={styles.provision}>, {citation.provision}</span>
      ) : null}
    </cite>
  );
}

export function CitationEntry({
  citation,
  asOf,
  locale,
}: {
  readonly citation: Citation;
  readonly asOf: IsoDate;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  const band = staleness(citation, asOf);
  const bandView = stalenessView(band);
  const age = citationAgeDays(citation, asOf);

  return (
    <li className={styles.entry} id={citationAnchor(citation.id)}>
      <div className={styles.entryHead}>
        <code className={styles.id}>{citation.id}</code>
        <Chip>{t(KIND_LABEL[citation.kind])}</Chip>
        <Chip>{citation.jurisdiction}</Chip>
        <Badge tone={bandView.tone} label={t(bandView.label)} />
        {citation.discretionary === true ? (
          <Badge tone="warn" label={t('Not a statutory threshold', 'No es un umbral legal')} />
        ) : null}
      </div>

      <p className={styles.instrument}>
        <InstrumentName citation={citation} />
      </p>

      <p className={styles.meta}>
        {t('Last verified against the source', 'Última verificación frente a la fuente')}
        {': '}
        <time dateTime={citation.verifiedOn} className={styles.date}>
          {citation.verifiedOn}
        </time>{' '}
        <span className={styles.age}>({agedDays(age, locale)})</span>
      </p>

      {citation.url !== undefined ? (
        <p className={styles.meta}>
          <a href={citation.url} rel="noreferrer noopener" target="_blank">
            {citation.url}
          </a>
        </p>
      ) : (
        <p className={styles.meta}>
          {t(
            'No canonical link is recorded. The catalog omits a URL rather than guess one.',
            'No consta enlace canónico. El catálogo omite la URL en lugar de suponerla.',
          )}
        </p>
      )}

      {citation.note !== undefined ? (
        <div className={citation.discretionary === true ? styles.caveat : styles.note}>
          {citation.discretionary === true ? (
            <p className={styles.caveatLead}>
              {t(
                'This is administrative practice, not a bright-line statutory threshold. Counsel must verify it for the specific file.',
                'Esto es práctica administrativa, no un umbral legal taxativo. Un letrado debe verificarlo para el expediente concreto.',
              )}
            </p>
          ) : null}
          {/* The catalog's own note, in the language it was authored in. */}
          <p lang="en">{citation.note}</p>
        </div>
      ) : null}
    </li>
  );
}

export function CitationList({
  citations,
  asOf,
  locale,
}: {
  readonly citations: readonly Citation[];
  readonly asOf: IsoDate;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  if (citations.length === 0) {
    return <p className={styles.meta}>{t('No sources recorded.', 'No constan fuentes.')}</p>;
  }
  return (
    <ol className={styles.list}>
      {citations.map((citation) => (
        <CitationEntry locale={locale} key={citation.id} citation={citation} asOf={asOf} />
      ))}
    </ol>
  );
}

/**
 * An id that no source in scope resolves.
 *
 * Rendered loudly rather than dropped. A citation id with nothing behind it is
 * a defect in the catalog or in the wiring, and hiding it would leave a rule on
 * screen with no way to check it — which is precisely the state the `Citation`
 * type exists to prevent.
 */
export function UnresolvedCitation({
  id,
  locale,
}: {
  readonly id: string;
  readonly locale: Locale;
}) {
  const t = translator(locale);
  return (
    <li className={styles.entry}>
      <div className={styles.entryHead}>
        <code className={styles.id}>{id}</code>
        <PlainBadge tone="bad">{t('Unresolved', 'Sin resolver')}</PlainBadge>
      </div>
      <p className={styles.meta}>
        {t(
          'This rule cites a source that is not available in this build. Treat the rule as unverified until it resolves.',
          'Esta norma cita una fuente que no está disponible en esta compilación. Trate la norma como no verificada hasta que se resuelva.',
        )}
      </p>
    </li>
  );
}
