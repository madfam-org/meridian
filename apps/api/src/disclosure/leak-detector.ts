/**
 * A backstop, not the mechanism.
 *
 * The mechanism is that engine output can only be constructed as an
 * `EngineOutput` and only serialised by the gate. This module catches the case
 * that mechanism cannot: a handler declared `engineOutput: false` that returns a
 * raw engine value anyway — a `Pathway` straight out of the catalog, an
 * `AssistedHandoff` read back from storage, a `Disclosable` unwrapped by hand.
 *
 * It looks for two shapes, and only two:
 *
 *   1. a `classification` property whose value is a `DisclosureClass`. Every
 *      `Disclosable`, every `EligibilityReport`, and every `AssistedHandoff`
 *      carries one.
 *   2. an object shaped like a `Citation` — `id`, `instrument`, `jurisdiction`
 *      and `verifiedOn`, all strings. Every rule the platform applies carries
 *      one, so anything restating law drags a `Citation` along with it.
 *
 * What it deliberately does *not* look for is a bare `citationIds` array. Stored
 * `Task` records carry one legitimately, and a check that fires on ordinary
 * checklist data is a check somebody switches off.
 *
 * Both traversal limits are hard. An unbounded walk over an attacker-influenced
 * payload is a denial of service, and a detector that can hang the process is
 * worse than the leak it prevents. Hitting a limit is reported as an
 * inconclusive scan, not as "clean" — the caller decides, and the disclosure
 * hook treats inconclusive as a failure on routes that could plausibly carry
 * engine output.
 */

const DISCLOSURE_CLASSES: readonly string[] = ['information', 'assessment', 'advice'];

const MAX_NODES = 5_000;
const MAX_DEPTH = 8;

export type LeakScan =
  | { readonly outcome: 'clean' }
  | { readonly outcome: 'leak'; readonly path: string; readonly shape: 'classification' | 'citation' }
  | { readonly outcome: 'inconclusive'; readonly limit: 'nodes' | 'depth' };

/**
 * `instrument` is what makes this test safe rather than merely plausible.
 *
 * A representative record also carries `id`, `jurisdiction` and `verifiedOn` —
 * it is a licence checked against a public register on a date — and matching on
 * those three alone would flag `GET /v1/tenants/me` as a leak on its first call.
 * `instrument` names a legal source and appears on nothing else in this service.
 */
function isCitationShaped(value: Record<string, unknown>): boolean {
  return (
    typeof value['id'] === 'string' &&
    typeof value['instrument'] === 'string' &&
    typeof value['jurisdiction'] === 'string' &&
    typeof value['verifiedOn'] === 'string'
  );
}

/** Walk a response payload looking for ungated engine content. */
export function scanForDisclosureLeak(payload: unknown): LeakScan {
  let nodes = 0;

  const visit = (value: unknown, path: string, depth: number): LeakScan => {
    if (value === null || typeof value !== 'object') return { outcome: 'clean' };
    nodes += 1;
    if (nodes > MAX_NODES) return { outcome: 'inconclusive', limit: 'nodes' };
    if (depth > MAX_DEPTH) return { outcome: 'inconclusive', limit: 'depth' };

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = visit(value[i], `${path}[${i}]`, depth + 1);
        if (result.outcome !== 'clean') return result;
      }
      return { outcome: 'clean' };
    }

    const record = value as Record<string, unknown>;

    const classification = record['classification'];
    if (typeof classification === 'string' && DISCLOSURE_CLASSES.includes(classification)) {
      return { outcome: 'leak', path: `${path}.classification`, shape: 'classification' };
    }
    if (isCitationShaped(record)) {
      return { outcome: 'leak', path, shape: 'citation' };
    }

    for (const [key, child] of Object.entries(record)) {
      const result = visit(child, path === '' ? key : `${path}.${key}`, depth + 1);
      if (result.outcome !== 'clean') return result;
    }
    return { outcome: 'clean' };
  };

  return visit(payload, '', 0);
}
