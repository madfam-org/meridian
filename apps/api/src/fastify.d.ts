/**
 * Fastify type augmentation.
 *
 * `FastifyContextConfig.meridian` is the important one. Making it part of the
 * route config type is what lets `registerRoute` demand it and the `onRoute`
 * hook refuse a route that lacks it: every route in this service has to state,
 * at registration, whether it emits engine output and who may call it. A route
 * cannot be added without answering both questions.
 */

import type { AuthContext } from './auth/context.js';
import type { MeridianRouteConfig, RouteRegistry } from './routes/registry.js';
import type { RequestContext } from './request-context.js';
import type { AppServices } from './services.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the auth hook on every non-public route; `null` on public ones. */
    ctx: RequestContext | null;
  }

  interface FastifyContextConfig {
    meridian?: MeridianRouteConfig;
  }

  interface FastifyInstance {
    meridian: {
      readonly services: AppServices;
      readonly routes: RouteRegistry;
    };
  }
}
