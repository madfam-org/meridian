import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadConfig } from '../src/config.js';
import { TEST_ENV } from './harness.js';

describe('configuration', () => {
  it('accepts a complete environment', () => {
    const config = loadConfig(TEST_ENV);
    expect(config.PORT).toBe(8000);
    expect(config.NODE_ENV).toBe('test');
    expect(config.CORS_ALLOWED_ORIGINS).toEqual([
      'https://app.meridian.test',
      'https://admin.meridian.test',
    ]);
  });

  it('reports every missing variable at once, by name', () => {
    // One problem per redeploy is how a deployment takes an afternoon.
    expect(() => loadConfig({})).toThrow(ConfigurationError);
    try {
      loadConfig({});
      expect.unreachable('an empty environment must not produce a config');
    } catch (error) {
      const configError = error as ConfigurationError;
      expect(configError.variables).toEqual(
        expect.arrayContaining([
          'DATABASE_URL',
          'JANUA_JWKS_URL',
          'JANUA_ISSUER',
          'JANUA_AUDIENCE',
          'PORT',
          'NODE_ENV',
          'CORS_ALLOWED_ORIGINS',
        ]),
      );
      expect(configError.message).toContain('is required but was not set');
    }
  });

  it('never echoes a value it rejected', () => {
    // The one variable that carries a password is the one most likely to be
    // malformed, and a config error that quotes it publishes it to the logs.
    const secretish = 'mysql://meridian:hunter2@db.internal:3306/meridian';
    try {
      loadConfig({ ...TEST_ENV, DATABASE_URL: secretish });
      expect.unreachable('a mysql URL is not a postgres connection string');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).not.toContain('hunter2');
      expect(message).not.toContain(secretish);
    }
  });

  it.each([
    ['*', 'a bare wildcard'],
    ['https://*.meridian.test', 'a wildcard subdomain'],
    ['null', 'the literal null origin'],
    ['https://app.meridian.test/console', 'an origin carrying a path'],
    ['app.meridian.test', 'an origin with no scheme'],
    ['https://evil.example@app.meridian.test', 'credentials embedded in the authority'],
  ])('refuses %s as a CORS origin (%s)', (origin) => {
    expect(() => loadConfig({ ...TEST_ENV, CORS_ALLOWED_ORIGINS: origin })).toThrow(
      ConfigurationError,
    );
  });

  it('refuses an empty CORS allowlist rather than defaulting to permissive', () => {
    expect(() => loadConfig({ ...TEST_ENV, CORS_ALLOWED_ORIGINS: '' })).toThrow(ConfigurationError);
    expect(() => loadConfig({ ...TEST_ENV, CORS_ALLOWED_ORIGINS: ' , , ' })).toThrow(
      ConfigurationError,
    );
  });

  it('refuses a port outside the valid range or written as a word', () => {
    expect(() => loadConfig({ ...TEST_ENV, PORT: '0' })).toThrow(ConfigurationError);
    expect(() => loadConfig({ ...TEST_ENV, PORT: '70000' })).toThrow(ConfigurationError);
    expect(() => loadConfig({ ...TEST_ENV, PORT: 'six-thousand' })).toThrow(ConfigurationError);
  });

  it('refuses a plaintext JWKS URL that is not localhost', () => {
    // A JWKS fetched over http is a JWKS an on-path attacker chooses.
    expect(() =>
      loadConfig({ ...TEST_ENV, JANUA_JWKS_URL: 'http://auth.madfam.io/jwks.json' }),
    ).toThrow(ConfigurationError);
    expect(() =>
      loadConfig({ ...TEST_ENV, JANUA_JWKS_URL: 'http://localhost:8080/jwks.json' }),
    ).not.toThrow();
  });

  it('defaults only what is safe to default', () => {
    const config = loadConfig(TEST_ENV);
    expect(config.RATE_LIMIT_WINDOW).toBe('1 minute');
    // TRUST_PROXY defaults to false: trusting X-Forwarded-For on a directly
    // exposed service lets any client forge its own address.
    expect(config.TRUST_PROXY).toBe(false);
  });
});
