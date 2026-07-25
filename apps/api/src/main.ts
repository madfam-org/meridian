/**
 * The composition root.
 *
 * The only file that reads `process.env`, constructs a database client, or binds
 * a socket. Everything else takes what it needs as an argument, which is why the
 * test suite can assemble the same application with an in-memory store and a
 * local key pair and still be testing the real thing.
 *
 * **Why the Prisma client is loaded through a variable specifier.** The client
 * is generated from `prisma/schema.prisma`, and generation is a build step. A
 * static `import '@prisma/client'` would make `tsc --noEmit` depend on that step
 * having been run — the type check would fail on a clean checkout, or worse,
 * pass against a client someone generated from an older schema. Loading it by
 * name at runtime and checking its shape with `assertPrismaClientShape` moves the
 * failure to boot, where it belongs, and makes the message actionable: it names
 * the missing delegate and tells the operator to run `db:generate`.
 *
 * **Shutdown drains before it disconnects.** `app.close()` stops accepting new
 * connections and waits for in-flight requests, and only then is the database
 * released. Reversing that order fails the requests that were already running —
 * including, potentially, an audit append, which would leave a mutation with no
 * trail.
 */

import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { defaultRegistry } from '@meridian/govtech';
import { MERIDIAN_PATHWAY_CATALOG } from '@meridian/pathways';

import { buildApp } from './app.js';
import { createJanuaVerifier } from './auth/verifier.js';
import { systemClock } from './clock.js';
import { ConfigurationError, loadConfig, type ApiConfig } from './config.js';
import { PrismaRepositoryProvider } from './repositories/prisma.js';
import { assertPrismaClientShape } from './repositories/prisma-client.js';
import type { RepositoryProvider } from './repositories/types.js';
import type { AppServices } from './services.js';

async function connectPrisma(config: ApiConfig): Promise<RepositoryProvider> {
  // Not a literal specifier: see the module note. TypeScript does not resolve
  // the module, which is the point — the generated client is not present at
  // type-check time and must not be a compile-time dependency.
  const specifier = '@prisma/client';
  const loaded: unknown = await import(specifier);
  const exported = (loaded as { PrismaClient?: unknown }).PrismaClient;
  if (typeof exported !== 'function') {
    throw new TypeError(
      'The @prisma/client package exports no PrismaClient. Run `pnpm --filter @meridian/api db:generate`.',
    );
  }
  const Client = exported as new (options: { datasources: { db: { url: string } } }) => unknown;
  const client = assertPrismaClientShape(
    new Client({ datasources: { db: { url: config.DATABASE_URL } } }),
  );
  return new PrismaRepositoryProvider(client);
}

export async function start(): Promise<void> {
  let config: ApiConfig;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      // Straight to stderr: there is no logger yet, and a configuration failure
      // that only appears in a structured log nobody has configured is a
      // configuration failure nobody sees.
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 78; // EX_CONFIG
      return;
    }
    throw error;
  }

  const repositories = await connectPrisma(config);

  const services: AppServices = {
    config,
    clock: systemClock,
    repositories,
    verifier: createJanuaVerifier({
      jwksUrl: config.JANUA_JWKS_URL,
      issuer: config.JANUA_ISSUER,
      audience: config.JANUA_AUDIENCE,
    }),
    govtech: defaultRegistry(),
    catalog: MERIDIAN_PATHWAY_CATALOG,
    newId: () => randomUUID(),
  };

  const app = await buildApp({ services });
  // Boot before binding a socket, so a misconfigured plugin or a route missing
  // its Meridian metadata fails here rather than on the first request.
  await app.ready();

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'shutting down');
    try {
      // Drain first: in-flight requests finish, including their audit appends.
      await app.close();
      await repositories.close();
      app.log.info('shutdown complete');
    } catch (error) {
      app.log.error({ err: error }, 'shutdown failed');
      process.exitCode = 1;
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      store: repositories.kind,
      // Names only, never values — see the note in config.ts.
      corsOrigins: config.CORS_ALLOWED_ORIGINS.length,
    },
    'meridian api listening',
  );
}

// `import.meta.url` compared against argv[1] would need a path conversion; the
// build produces a single entry point, so starting unconditionally is correct
// and keeps the module free of environment sniffing.
await start();
