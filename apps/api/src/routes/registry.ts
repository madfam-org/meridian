/**
 * Route metadata, and the reason no route can quietly bypass the gate.
 *
 * Fastify's `onRoute` hook fires for *every* route registered under an instance,
 * however it was registered — directly, by a plugin, or by a plugin three levels
 * down. The hook installed by {@link installRouteRegistry} refuses any route
 * whose config lacks a `meridian` block. So a developer adding a route does not
 * get to skip the question "does this return engine output"; the server does not
 * start until they answer it.
 *
 * That is the structural half. The runtime half lives in the disclosure plugin:
 * a route that declares `engineOutput: true` and returns something that is not an
 * `EngineOutput` fails, and a route that declares `false` and returns a payload
 * with engine-shaped content in it fails too. Between the two, "engine output
 * left this service ungated" is not a state the process can reach.
 *
 * The registry is exposed on the instance so a test can enumerate it — the
 * assertion "every engine-output route actually emitted a gate decision" needs
 * the list of routes to be data rather than documentation.
 */

import type { FastifyInstance, RouteOptions } from 'fastify';

import type { Role } from '../auth/context.js';

export interface MeridianRouteConfig {
  /** One line, factual. Shown in the route table a test prints on failure. */
  readonly summary: string;
  /**
   * True when the handler returns an `EngineOutput`. Enforced both ways: a
   * `true` route that returns anything else is a 500, and so is a `false` route
   * whose payload contains a classification or a citation.
   */
  readonly engineOutput: boolean;
  /**
   * `public` skips authentication entirely and is only ever correct for the
   * health endpoints. Everything else is `authenticated`.
   */
  readonly access: 'public' | 'authenticated';
  /** Any-of. Absent means any authenticated member of the tenant. */
  readonly requiredRoles?: readonly Role[];
}

export interface RegisteredRoute {
  readonly method: string;
  readonly url: string;
  readonly config: MeridianRouteConfig;
}

export interface RouteRegistry {
  readonly all: readonly RegisteredRoute[];
  /** Routes whose responses must carry a gate decision. */
  engineOutputRoutes(): readonly RegisteredRoute[];
}

class MutableRouteRegistry implements RouteRegistry {
  private readonly entries: RegisteredRoute[] = [];

  get all(): readonly RegisteredRoute[] {
    return this.entries;
  }

  add(entry: RegisteredRoute): void {
    this.entries.push(entry);
  }

  engineOutputRoutes(): readonly RegisteredRoute[] {
    return this.entries.filter((r) => r.config.engineOutput);
  }
}

export class RouteDeclarationError extends Error {
  constructor(method: string, url: string) {
    super(
      `Route ${method} ${url} was registered without a \`config.meridian\` block. Every route must ` +
        'declare whether it emits engine output and who may call it — see src/routes/registry.ts.',
    );
    this.name = 'RouteDeclarationError';
  }
}

/**
 * Routes registered by a framework plugin rather than by us.
 *
 * There is exactly one, and it is enumerated rather than pattern-matched so that
 * a second one cannot appear unnoticed. `@fastify/cors` registers `OPTIONS *` so
 * Fastify will route a preflight at all; the reply is produced in the plugin's
 * own `onRequest` hook and carries headers and no body, so it cannot convey
 * engine output. It is `public` because a browser does not send `Authorization`
 * on a preflight — requiring auth there breaks CORS for every client.
 */
const FRAMEWORK_ROUTES: readonly {
  readonly method: string;
  readonly url: string;
  readonly summary: string;
}[] = [{ method: 'OPTIONS', url: '*', summary: 'CORS preflight (@fastify/cors)' }];

function frameworkRoute(method: string, url: string): MeridianRouteConfig | null {
  const match = FRAMEWORK_ROUTES.find((r) => r.method === method && r.url === url);
  return match === undefined
    ? null
    : { summary: match.summary, engineOutput: false, access: 'public' };
}

/**
 * Install the `onRoute` hook. Must run before any route is registered.
 *
 * `HEAD` routes that Fastify derives from a `GET` inherit the same config, so
 * they are recorded too rather than special-cased — a `HEAD` that skipped the
 * gate would still be a response leaving the service, even if it carries no body.
 */
export function installRouteRegistry(app: FastifyInstance): RouteRegistry {
  const registry = new MutableRouteRegistry();

  app.addHook('onRoute', (route: RouteOptions) => {
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    const declared = route.config?.meridian;
    for (const method of methods) {
      const config = declared ?? frameworkRoute(method, route.url);
      if (config === undefined || config === null) {
        throw new RouteDeclarationError(method, route.url);
      }
      // Attach the synthesized config to the route itself, not just to the
      // registry. Otherwise the auth hook would see no config at request time
      // and fall through its "no route matched" branch — the registry would say
      // one thing and the running server another.
      if (declared === undefined) {
        route.config = { ...route.config, meridian: config };
      }
      registry.add({ method, url: route.url, config });
    }
  });

  return registry;
}
