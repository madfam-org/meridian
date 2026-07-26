/**
 * The read-proof for `tests/support/egress.ts`.
 *
 * Three tool tests assert that nothing a reader typed left the page. Those
 * assertions are only worth anything if the watcher can actually see a write —
 * a spy attached to the wrong object, or a channel jsdom does not implement,
 * makes "nothing left the page" and "I was not looking" produce the same green
 * tick.
 *
 * So this file writes to every channel deliberately and requires the watcher to
 * name each one. If a future jsdom or Node version moves one of them, this turns
 * red here rather than silently disarming the privacy assertions elsewhere.
 */

import { describe, expect, it } from 'vitest';

import { watchEgress } from '../support/egress';

describe('the egress watcher', () => {
  it('is silent when nothing happens', () => {
    const watch = watchEgress();
    try {
      watch.expectSilent();
    } finally {
      watch.restore();
    }
  });

  it('sees a write to every channel it claims to cover', async () => {
    const watch = watchEgress();
    try {
      localStorage.setItem('k', 'v');
      localStorage.removeItem('k');
      sessionStorage.clear();
      new XMLHttpRequest().open('GET', '/x');
      window.history.pushState({}, '', '/x');
      window.history.replaceState({}, '', '/x');
      document.cookie = 'k=v';
      void fetch('/x');
      navigator.sendBeacon('/x');

      expect(watch.calls().sort()).toEqual([
        'Storage.clear',
        'Storage.removeItem',
        'Storage.setItem',
        'XMLHttpRequest.open',
        'document.cookie',
        'fetch',
        'history.pushState',
        'history.replaceState',
        'navigator.sendBeacon',
      ]);
      expect(() => {
        watch.expectSilent();
      }).toThrow();
    } finally {
      watch.restore();
    }
  });

  it('names the channel that fired, so a failure is actionable', () => {
    const watch = watchEgress();
    try {
      sessionStorage.setItem('mrz', 'P<ZZZSPECIMEN');
      expect(watch.calls()).toEqual(['Storage.setItem']);
    } finally {
      watch.restore();
    }
  });
});
