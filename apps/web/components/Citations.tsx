import type { Citation, IsoDate, SourceKind } from '@meridian/core';
import { citationAgeDays, staleness } from '@meridian/core';

import { bi, type Bi } from '@/lib/i18n';
import { days } from '@/lib/ui';
import { Badge, Chip, PlainBadge } from '@/components/Badge';
import { T, TInline } from '@/components/Bilingual';
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

/**
 * Language of an instrument's own title.
 *
 * A heuristic on the issuing jurisdiction, and only a heuristic: every Spanish
 * instrument in the current catalog is titled in Spanish and everything else is
 * titled in English. It exists so a screen reader does not pronounce "Real
 * Decreto 1004/2015" with English phonemes. If the catalog gains, say, a
 * Québec instrument titled in French, this needs a real field on `Citation`
 * rather than a wider guess here.
 */
function instrumentLang(citation: Citation): string {
  return citation.jurisdiction.toUpperCase() === 'ES' ? 'es' : 'en';
}

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

export function CitationEntry({
  citation,
  asOf,
}: {
  readonly citation: Citation;
  readonly asOf: IsoDate;
}) {
  const band = staleness(citation, asOf);
  const bandView = stalenessView(band);
  const age = citationAgeDays(citation, asOf);

  return (
    <li className={styles.entry} id={citationAnchor(citation.id)}>
      <div className={styles.entryHead}>
        <code className={styles.id}>{citation.id}</code>
        <Chip>{KIND_LABEL[citation.kind].en}</Chip>
        <Chip>{citation.jurisdiction}</Chip>
        <Badge tone={bandView.tone} label={bandView.label} />
        {citation.discretionary === true ? (
          <Badge
            tone="warn"
            label={bi('Not a statutory threshold', 'No es un umbral legal')}
          />
        ) : null}
      </div>

      <p className={styles.instrument} lang={instrumentLang(citation)}>
        {citation.instrument}
        {citation.provision !== undefined ? (
          <span className={styles.provision}>, {citation.provision}</span>
        ) : null}
      </p>

      <p className={styles.meta}>
        <TInline text={bi('Last verified against the source', 'Última verificación frente a la fuente')} />
        {': '}
        <time dateTime={citation.verifiedOn} className={styles.date}>
          {citation.verifiedOn}
        </time>{' '}
        <span className={styles.age}>({days(age)} ago)</span>
      </p>

      {citation.url !== undefined ? (
        <p className={styles.meta}>
          <a href={citation.url} rel="noreferrer noopener" target="_blank">
            {citation.url}
          </a>
        </p>
      ) : (
        <p className={styles.meta}>
          <T
            text={bi(
              'No canonical link is recorded. The catalog omits a URL rather than guess one.',
              'No consta enlace canónico. El catálogo omite la URL en lugar de suponerla.',
            )}
          />
        </p>
      )}

      {citation.note !== undefined ? (
        <div className={citation.discretionary === true ? styles.caveat : styles.note}>
          {citation.discretionary === true ? (
            <p className={styles.caveatLead}>
              <T
                text={bi(
                  'This is administrative practice, not a bright-line statutory threshold. Counsel must verify it for the specific file.',
                  'Esto es práctica administrativa, no un umbral legal taxativo. Un letrado debe verificarlo para el expediente concreto.',
                )}
              />
            </p>
          ) : null}
          <p lang="en">{citation.note}</p>
        </div>
      ) : null}
    </li>
  );
}

export function CitationList({
  citations,
  asOf,
}: {
  readonly citations: readonly Citation[];
  readonly asOf: IsoDate;
}) {
  if (citations.length === 0) {
    return (
      <p className={styles.meta}>
        <T text={bi('No sources recorded.', 'No constan fuentes.')} />
      </p>
    );
  }
  return (
    <ol className={styles.list}>
      {citations.map((citation) => (
        <CitationEntry key={citation.id} citation={citation} asOf={asOf} />
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
export function UnresolvedCitation({ id }: { readonly id: string }) {
  return (
    <li className={styles.entry}>
      <div className={styles.entryHead}>
        <code className={styles.id}>{id}</code>
        <PlainBadge tone="bad">Unresolved</PlainBadge>
      </div>
      <p className={styles.meta}>
        <T
          text={bi(
            'This rule cites a source that is not available in this build. Treat the rule as unverified until it resolves.',
            'Esta norma cita una fuente que no está disponible en esta compilación. Trate la norma como no verificada hasta que se resuelva.',
          )}
        />
      </p>
    </li>
  );
}
