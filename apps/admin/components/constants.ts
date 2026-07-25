/**
 * Constants shared across the server/client boundary.
 *
 * These deliberately live in a module with no `'use client'` directive. When a
 * server component imports a value from a client module, the bundler replaces
 * the import with a client reference — the component works, but a plain constant
 * read on the server comes back `undefined`. That failure is silent: the theme
 * bootstrap reads `localStorage.getItem(undefined)` and quietly stops
 * remembering the choice, and the quick-filter attribute never reaches the DOM
 * so `/` focuses nothing. Both were real, both were caught by rendering the page
 * and reading the HTML rather than by the type checker.
 *
 * So anything both sides need is declared here, where both sides can read it.
 */

/** `localStorage` key holding the explicit theme choice. */
export const THEME_STORAGE_KEY = 'meridian-admin-theme';

/**
 * Marks the field the `/` shortcut focuses. Put it on the first meaningful
 * filter input of a page; the first match in document order wins.
 */
export const QUICK_FILTER_ATTRIBUTE = 'data-quickfilter';

/** How long the `g` navigation prefix stays armed, in milliseconds. */
export const CHORD_TIMEOUT_MS = 1500;
