import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Unmount between tests, explicitly.
 *
 * Testing Library registers its own `afterEach` when a global one exists, so
 * this is a belt on top of braces — but several tests here address elements by
 * DOM id (`sch-result`, `sch-error-summary`, and the per-row field ids that
 * `stayFieldId` produces), and those ids are deliberately stable strings rather
 * than generated ones. A tree left mounted by a failing test would make the
 * next one read the wrong document and report a pass about a form nobody is
 * looking at.
 */
afterEach(() => {
  cleanup();
});
