/**
 * The coverage boundary, rendered.
 *
 * Two components, because the same statement has to reach two readers who
 * arrive at it completely differently.
 *
 * `CoverageBoundary` is the full statement. It is a page-level region with a
 * stable id, so anything else on the page can link to it, and it sits high
 * enough that a visitor who never presses the button still reads it.
 *
 * `CoverageResultNotice` is for inside a result panel. A person who submits a
 * form scrolls to the answer and reads nothing above it — the boundary at the
 * top of the page is already off screen by the time the verdict appears, and the
 * verdict is exactly the moment a wrong conclusion gets drawn. So the result
 * carries its own copy: the sentence that matters, the routes by name, and a
 * link to the full statement. It is deliberately not a footnote and not a muted
 * aside; it is tinted, titled and placed among the result blocks.
 *
 * Both take the covered set from the catalog and the missing set from
 * `lib/coverage.ts`, so neither can drift from what actually ships. Neither
 * ranks anything, neither measures anything against anybody's facts, and neither
 * says what a reader should do beyond "ask somebody who is accountable for the
 * answer" — which is the one instruction a page with no licensed person behind
 * it is entitled to give.
 */

import Link from 'next/link';

import { bi } from '@/lib/i18n';
import { plural } from '@/lib/ui';
import {
  COVERAGE_TITLE,
  COVERED_JURISDICTIONS,
  JURISDICTIONS_WITHOUT_REGISTER,
  NOT_A_VERDICT_ON_YOU,
  OUT_OF_SCOPE_PROTECTION,
  REGISTER_IS_NOT_EXHAUSTIVE,
  WHERE_TO_ASK,
  coveredIn,
  jurisdictionName,
  uncoveredIn,
} from '@/lib/coverage';
import { Chip } from '@/components/Badge';
import { T, TInline, TProse } from '@/components/Bilingual';

import styles from './CoverageBoundary.module.css';

/** The anchor the result notice links to. One per page; the full statement owns it. */
export const COVERAGE_BOUNDARY_ID = 'coverage-boundary';

export interface CoverageScope {
  /**
   * Jurisdiction codes to speak about. Defaults to every jurisdiction in the
   * catalog, which is right for an index or a tool that is not tied to one
   * country. A page about a single jurisdiction should pass just that one:
   * listing Canadian omissions under a Spanish nationality result is noise, and
   * noise is what a reader learns to skip.
   */
  readonly jurisdictions?: readonly string[];
}

/** Every jurisdiction in the catalog unless the caller narrowed it. */
function scopeOf(jurisdictions: readonly string[] | undefined): readonly string[] {
  return jurisdictions ?? COVERED_JURISDICTIONS;
}

/**
 * The full statement.
 *
 * Rendered as a `section` with its own heading so it appears in the document
 * outline rather than being a coloured rectangle a screen-reader user walks
 * past, and with `role="note"` omitted deliberately — this is page content, not
 * an aside about the page.
 */
export function CoverageBoundary({ jurisdictions }: CoverageScope) {
  const scope = scopeOf(jurisdictions);
  const missing = uncoveredIn(scope);
  const unknown = JURISDICTIONS_WITHOUT_REGISTER.filter((code) => scope.includes(code));
  const headingId = `${COVERAGE_BOUNDARY_ID}-heading`;

  return (
    <section className={styles.boundary} id={COVERAGE_BOUNDARY_ID} aria-labelledby={headingId}>
      <h2 className={styles.title} id={headingId}>
        <span aria-hidden="true" className={styles.mark}>
          ⚑
        </span>
        <T text={COVERAGE_TITLE} />
      </h2>

      <TProse className={styles.lead} text={NOT_A_VERDICT_ON_YOU} />

      <div className={styles.covered}>
        <h3 className={styles.subheading}>
          <T text={bi('What is encoded', 'Qué está codificado')} />
        </h3>
        <ul className={styles.jurisdictions}>
          {scope.map((code) => {
            const routes = coveredIn(code);
            return (
              <li key={code}>
                <p className={styles.jurisdictionHead}>
                  <Chip>{code}</Chip>{' '}
                  <TInline text={jurisdictionName(code)} />
                  {' — '}
                  <strong>
                    <TInline
                      text={bi(
                        plural(routes.length, 'route encoded', 'routes encoded'),
                        plural(routes.length, 'vía codificada', 'vías codificadas'),
                      )}
                    />
                  </strong>
                </p>
                {routes.length === 0 ? null : (
                  <ul className={styles.routes}>
                    {routes.map((route) => (
                      <li key={route.id}>
                        <Link href={`/pathways/${route.id}`}>
                          <T text={route.name} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.missing}>
        <h3 className={styles.subheading}>
          <T text={bi('What is not encoded', 'Qué no está codificado')} />
        </h3>

        {missing.length === 0 ? (
          <TProse
            text={bi(
              'Every route this page knows to name has since been encoded. That is not a claim that the catalog is complete — it means the list of known omissions is empty, which is a different and much weaker statement.',
              'Todas las vías que esta página sabe nombrar han sido codificadas. No es una afirmación de que el catálogo esté completo: significa que la lista de omisiones conocidas está vacía, lo cual es una afirmación distinta y mucho más débil.',
            )}
          />
        ) : (
          <ul className={styles.gaps}>
            {missing.map((route) => (
              <li className={styles.gap} key={route.key}>
                <p className={styles.gapName}>
                  <Chip>{route.jurisdiction}</Chip> <T text={route.name} />
                </p>
                <TProse className={styles.gapSource} text={route.source} />
              </li>
            ))}
          </ul>
        )}

        {unknown.length > 0 ? (
          <TProse
            className={styles.unknown}
            text={bi(
              `This catalog also encodes routes for ${unknown.join(', ')}, and nobody has written down what is missing there. Treat coverage for ${unknown.length === 1 ? 'that jurisdiction' : 'those jurisdictions'} as unknown rather than complete.`,
              `Este catálogo también codifica vías para ${unknown.join(', ')}, y nadie ha dejado constancia de qué falta allí. Considere la cobertura de ${unknown.length === 1 ? 'esa jurisdicción' : 'esas jurisdicciones'} como desconocida y no como completa.`,
            )}
          />
        ) : null}

        <TProse className={styles.footnote} text={REGISTER_IS_NOT_EXHAUSTIVE} />
      </div>

      <div className={styles.block}>
        <h3 className={styles.subheading}>
          <T text={bi('Deliberately out of scope', 'Deliberadamente fuera de alcance')} />
        </h3>
        <TProse text={OUT_OF_SCOPE_PROTECTION} />
      </div>

      <div className={styles.block}>
        <h3 className={styles.subheading}>
          <T text={bi('Who to ask instead', 'A quién preguntar en su lugar')} />
        </h3>
        <TProse text={WHERE_TO_ASK} />
      </div>
    </section>
  );
}

/**
 * The same boundary, sized for a result panel.
 *
 * It names the missing routes rather than gesturing at them, because "other
 * routes exist" tells a reader nothing they can act on, and it links to the full
 * statement on the same page instead of repeating it. `warn`-tinted and titled:
 * the reader has just been told a rule was not met, and this is the correction
 * to the conclusion they are about to draw from that.
 */
export function CoverageResultNotice({ jurisdictions }: CoverageScope) {
  const scope = scopeOf(jurisdictions);
  const missing = uncoveredIn(scope);

  return (
    <aside className={styles.notice} role="note">
      <h3 className={styles.noticeTitle}>
        <span aria-hidden="true" className={styles.mark}>
          ⚑
        </span>
        <T
          text={bi(
            'This is not the whole of the law, and it is not a verdict on you',
            'Esto no es todo el derecho aplicable ni es un veredicto sobre usted',
          )}
        />
      </h3>

      <TProse text={NOT_A_VERDICT_ON_YOU} />

      {missing.length > 0 ? (
        <>
          <p className={styles.noticeLabel}>
            <TInline
              text={bi('Not encoded anywhere in Meridian', 'No codificado en ninguna parte de Meridian')}
            />
          </p>
          <ul className={styles.noticeGaps}>
            {missing.map((route) => (
              <li key={route.key}>
                <Chip>{route.jurisdiction}</Chip> <T text={route.name} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <TProse text={OUT_OF_SCOPE_PROTECTION} />

      <p className={styles.noticeLink}>
        <a href={`#${COVERAGE_BOUNDARY_ID}`}>
          <TInline
            text={bi(
              'The full coverage statement, and who to ask instead',
              'La declaración completa de cobertura y a quién preguntar en su lugar',
            )}
          />
          <span aria-hidden="true"> ↑</span>
        </a>
      </p>
    </aside>
  );
}
