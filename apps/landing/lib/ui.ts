/**
 * Small presentation helpers.
 *
 * Nothing here computes a legal figure or a catalog statistic. Counting lives in
 * `lib/catalog-facts.ts`, which reads the real packages; this file only decides
 * how an already-computed value is spelled on screen.
 */

/**
 * Join class names, dropping anything falsy.
 *
 * CSS Modules are typed as an index signature, so `styles.foo` is
 * `string | undefined` under `noUncheckedIndexedAccess`. Rather than assert
 * non-null at every call site — which would hide a genuine typo in a class name
 * — the undefined simply falls out here.
 */
export function cx(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}

/** `1 pathway` / `2 pathways`, with the caller's own nouns. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
