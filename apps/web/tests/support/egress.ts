/**
 * Proof that a browser tool kept what the reader typed.
 *
 * Every tool in this portal states on screen that nothing typed into it is
 * transmitted or stored. That claim is a property of the code — no `fetch`, no
 * server action, no storage write, no query-string round trip — and a property
 * is testable. These helpers install a spy on every route by which a value could
 * leave the page, so a future edit that adds "remember my last MRZ" turns the
 * suite red rather than shipping.
 *
 * A travel history and a passport number are exactly the values that must not
 * end up in a browser history entry, a form-fill cache or a server log.
 *
 * Channels jsdom does not implement — `sendBeacon` — are installed as stubs
 * rather than skipped. A tool that started calling one would otherwise throw
 * inside an event handler, which is a less legible failure than a named
 * channel, and on a jsdom upgrade the stub simply becomes a spy.
 */

import { expect, vi, type MockInstance } from 'vitest';

export interface EgressWatch {
  /** Assert nothing left the page. Names the channel that fired. */
  readonly expectSilent: () => void;
  /** Every channel that was used, for a test that wants to inspect it. */
  readonly calls: () => string[];
  readonly restore: () => void;
}

interface Channel {
  readonly name: string;
  readonly spy: MockInstance;
}

/** Install a callable stub where jsdom provides nothing, then spy on it. */
function stubbed(
  host: Record<string, unknown>,
  property: string,
  implementation: (...args: never[]) => unknown,
): MockInstance {
  if (typeof host[property] !== 'function') host[property] = implementation;
  return vi.spyOn(host as never, property as never).mockImplementation(implementation as never);
}

export function watchEgress(): EgressWatch {
  const channels: Channel[] = [
    { name: 'Storage.setItem', spy: vi.spyOn(Storage.prototype, 'setItem') },
    { name: 'Storage.removeItem', spy: vi.spyOn(Storage.prototype, 'removeItem') },
    { name: 'Storage.clear', spy: vi.spyOn(Storage.prototype, 'clear') },
    { name: 'XMLHttpRequest.open', spy: vi.spyOn(XMLHttpRequest.prototype, 'open') },
    { name: 'history.pushState', spy: vi.spyOn(window.history, 'pushState') },
    { name: 'history.replaceState', spy: vi.spyOn(window.history, 'replaceState') },
    {
      name: 'document.cookie',
      spy: vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation(() => undefined),
    },
    {
      // Never settles: recording the call is the point, and a rejected promise
      // nobody awaited would surface as an unhandled rejection instead of as
      // this assertion.
      name: 'fetch',
      spy: stubbed(globalThis as unknown as Record<string, unknown>, 'fetch', () => new Promise(() => undefined)),
    },
    {
      name: 'navigator.sendBeacon',
      spy: stubbed(navigator as unknown as Record<string, unknown>, 'sendBeacon', () => false),
    },
  ];

  const used = (): string[] =>
    channels.filter((c) => c.spy.mock.calls.length > 0).map((c) => c.name);

  return {
    calls: used,
    expectSilent: () => {
      expect(used(), 'a browser tool wrote to an egress channel').toEqual([]);
    },
    restore: () => {
      for (const channel of channels) channel.spy.mockRestore();
    },
  };
}
