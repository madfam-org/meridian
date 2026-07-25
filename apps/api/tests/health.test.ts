/**
 * Liveness and readiness.
 *
 * The test that matters is the one where a dependency is *down*. A readiness
 * probe nobody has ever seen fail is a readiness probe that reports ready when
 * the database is gone, and the load balancer keeps routing to it because it
 * said it was fine.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { safeReason } from '../src/routes/health.js';
import { buildApp } from '../src/app.js';
import { createVerifier } from '../src/auth/verifier.js';
import { fixedClock } from '../src/clock.js';
import { InMemoryRepositoryProvider } from '../src/repositories/memory.js';
import { defaultRegistry } from '@meridian/govtech';
import { err } from '@meridian/core';
import { createLocalJWKSet } from 'jose';
import type { FastifyInstance } from 'fastify';

import {
  AUDIENCE,
  ISSUER,
  TODAY,
  createHarness,
  testConfig,
  testKeys,
  type Harness,
} from './harness.js';

let harness: Harness;

beforeEach(async () => {
  harness = await createHarness();
});

afterEach(async () => {
  await harness.close();
});

interface ReadyBody {
  ready: boolean;
  asOf: string;
  checks: { name: string; status: 'pass' | 'fail'; detail: string; reason?: string }[];
}

describe('health', () => {
  it('liveness answers without touching a dependency', async () => {
    // Deliberately independent of the database: a liveness probe that fails on a
    // slow query gets the container killed and restarted into the same slow
    // database, turning a degradation into an outage.
    harness.provider.setHealthy(false, 'database is unreachable');
    const response = await harness.app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', asOf: TODAY });
  });

  it('readiness passes when every dependency answers', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    const body = response.json<ReadyBody>();
    expect(body.ready).toBe(true);
    expect(body.checks.map((c) => c.name).sort()).toEqual([
      'database',
      'govtech_registry',
      'identity',
    ]);
    expect(body.checks.every((c) => c.status === 'pass')).toBe(true);
  });

  it('readiness returns 503 and names the dependency that is down', async () => {
    harness.provider.setHealthy(false, 'connection refused to the primary');
    const response = await harness.app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<ReadyBody>();
    expect(body.ready).toBe(false);
    const database = body.checks.find((c) => c.name === 'database');
    expect(database?.status).toBe('fail');
    expect(database?.reason).toContain('connection refused');
    // The other checks still report their own state rather than being
    // short-circuited: an operator wants to know whether one thing is broken or
    // three.
    expect(body.checks.find((c) => c.name === 'identity')?.status).toBe('pass');
  });

  it('readiness fails when the identity provider key source is unreachable', async () => {
    // The failure mode this catches: an instance that reports ready, then 401s
    // every authenticated request the moment its key cache expires.
    const { jwks } = await testKeys();
    const provider = new InMemoryRepositoryProvider();
    const app: FastifyInstance = await buildApp({
      logger: false,
      services: {
        config: testConfig(),
        clock: fixedClock(TODAY),
        repositories: provider,
        verifier: createVerifier(
          createLocalJWKSet(jwks),
          { issuer: ISSUER, audience: AUDIENCE },
          'unreachable-jwks',
          async () => err(new Error('getaddrinfo ENOTFOUND auth.madfam.io')),
        ),
        govtech: defaultRegistry(),
        catalog: [],
        newId: () => 'id-static',
      },
    });

    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(503);
    const identity = response.json<ReadyBody>().checks.find((c) => c.name === 'identity');
    expect(identity?.status).toBe('fail');
    expect(identity?.reason).toContain('ENOTFOUND');
    await app.close();
  });

  it('never publishes a connection string in a readiness reason', () => {
    // Driver errors quote connection strings, and this endpoint is readable by
    // anything that can reach the port.
    const reason = safeReason(
      new Error(
        'Cannot connect to postgresql://meridian:hunter2@db.internal:5432/meridian — timeout',
      ),
    );
    expect(reason).not.toContain('hunter2');
    expect(reason).not.toContain('db.internal');
    expect(reason).toContain('[url]');
  });

  it('truncates a very long driver error rather than echoing it whole', () => {
    const reason = safeReason(new Error('x'.repeat(5000)));
    expect(reason.length).toBeLessThanOrEqual(200);
  });

  it('falls back to the error name when the message is empty', () => {
    const error = new Error('');
    error.name = 'ConnectionTimeout';
    expect(safeReason(error)).toBe('ConnectionTimeout');
  });

  it('health endpoints need no token', async () => {
    // A probe that needs a credential is a credential in a config nobody
    // rotates.
    for (const url of ['/health', '/health/ready']) {
      const response = await harness.app.inject({ method: 'GET', url });
      expect(response.statusCode).toBeLessThan(500);
    }
  });
});
