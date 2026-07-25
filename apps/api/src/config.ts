/**
 * Boot configuration, validated once and never guessed at.
 *
 * Two rules shape this module.
 *
 * **Fail loudly, at boot, on every problem at once.** A service that starts
 * with a missing `JANUA_JWKS_URL` and only discovers it when the first
 * authenticated request arrives has converted a deployment error into an
 * outage. `loadConfig` collects *all* problems and throws one error naming every
 * offending variable, so an operator fixes the whole set in one pass rather than
 * one redeploy per typo.
 *
 * **Never echo a value.** `DATABASE_URL` carries a password and this repository
 * is public. Every diagnostic here names the variable and states what was wrong
 * with it — "is not an absolute URL", "must not be empty" — and never
 * interpolates what was actually read. That rule holds for the whole file: if
 * you add a variable, add its *name* to a message, never its value.
 *
 * There are no defaults for anything a wrong guess would make dangerous. In
 * particular `PORT` has no default: a service that picks its own port in
 * production is a service that binds one nobody is routing to, and the failure
 * looks like a network problem for the first hour.
 */

import { z } from 'zod';

/** The port Meridian's API is assigned in the MADFAM ecosystem. */
export const MERIDIAN_API_PORT = 8000;

export type NodeEnv = 'development' | 'test' | 'production';

/**
 * An origin the browser may present, as `scheme://host[:port]` with no path.
 *
 * Wildcards are banned ecosystem-wide and the ban is enforced here rather than
 * in the CORS plugin, because a config that *contains* a wildcard has already
 * failed — it will be read by something eventually. `*` on a credentialed API
 * means any page on the internet can act as a logged-in caseworker.
 */
const originSchema = z
  .string()
  .trim()
  .min(1, 'must not be empty')
  .refine((v) => !v.includes('*'), {
    message: 'must not contain a wildcard; CORS wildcards are banned ecosystem-wide',
  })
  .refine((v) => v !== 'null', { message: 'must not be the literal "null" origin' })
  .refine(
    (v) => {
      const m = /^https?:\/\/([^/?#\s]+)$/.exec(v);
      const authority = m === null ? undefined : m[1];
      if (authority === undefined) return false;
      // Reject credentials embedded in the authority (`https://a@evil.example`):
      // an allowlist entry that parses differently from the browser's Origin
      // header is an allowlist entry that lets the wrong site through.
      return !authority.includes('@');
    },
    { message: 'must be an absolute origin such as https://app.example with no path or credentials' },
  );

const envSchema = z.object({
  /**
   * Postgres connection string. Secret: contains a password. Validated for
   * shape only, never logged, never included in an error message.
   */
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, 'must not be empty')
    .refine((v) => v.startsWith('postgres://') || v.startsWith('postgresql://'), {
      message: 'must be a postgres:// or postgresql:// connection string',
    }),

  /** JWKS endpoint of the Janua identity provider. Public, but still not logged at info. */
  JANUA_JWKS_URL: z
    .string()
    .trim()
    .url('must be an absolute URL')
    .refine((v) => v.startsWith('https://') || v.startsWith('http://localhost'), {
      message: 'must be https, or http on localhost for local development',
    }),

  /** Expected `iss`. A token from another issuer is not a token for us. */
  JANUA_ISSUER: z.string().trim().min(1, 'must not be empty'),

  /**
   * Expected `aud`. Without this, a token minted for a *different* service in
   * the same realm would authenticate here — the classic confused-deputy.
   */
  JANUA_AUDIENCE: z.string().trim().min(1, 'must not be empty'),

  PORT: z
    .string()
    .trim()
    .regex(/^\d+$/, 'must be a decimal port number')
    .transform((v) => Number.parseInt(v, 10))
    .refine((n) => n >= 1 && n <= 65_535, { message: 'must be between 1 and 65535' }),

  NODE_ENV: z.enum(['development', 'test', 'production'], {
    errorMap: () => ({ message: 'must be one of development, test, production' }),
  }),

  /** Comma-separated origin allowlist. See {@link originSchema}. */
  CORS_ALLOWED_ORIGINS: z
    .string()
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    )
    .pipe(z.array(originSchema).min(1, 'must list at least one origin')),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional()
    .default('info'),

  /** Requests per window per client, before 429. */
  RATE_LIMIT_MAX: z
    .string()
    .trim()
    .regex(/^\d+$/, 'must be a whole number')
    .transform((v) => Number.parseInt(v, 10))
    .refine((n) => n > 0, { message: 'must be greater than zero' })
    .optional()
    .default('600'),

  /** Rate-limit window, as a duration ms/`@fastify/rate-limit` understands, e.g. `1 minute`. */
  RATE_LIMIT_WINDOW: z.string().trim().min(1).optional().default('1 minute'),

  /**
   * Trust `X-Forwarded-For`. Only ever true behind a proxy that *overwrites* the
   * header — trusting it on a directly-exposed service lets any client forge its
   * own address and evade the rate limiter.
   */
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

export type ApiConfig = Readonly<z.infer<typeof envSchema>>;

/** Names of variables whose values must never reach a log line or an error message. */
export const CONFIDENTIAL_ENV_NAMES: readonly string[] = ['DATABASE_URL'];

export class ConfigurationError extends Error {
  /** Variable names that failed, in declaration order. Names only — never values. */
  readonly variables: readonly string[];

  constructor(problems: readonly { readonly name: string; readonly message: string }[]) {
    const lines = problems.map((p) => `  - ${p.name}: ${p.message}`).join('\n');
    super(
      `Meridian API cannot start: ${problems.length} environment variable${
        problems.length === 1 ? '' : 's'
      } missing or malformed.\n${lines}\n` +
        'Values are deliberately not shown. Fix the named variables and restart.',
    );
    this.name = 'ConfigurationError';
    this.variables = problems.map((p) => p.name);
  }
}

/**
 * Validate an environment record into a frozen config.
 *
 * Takes the environment as an argument rather than reading `process.env`
 * directly, so tests and the composition root use the same code path and there
 * is no second, untested way to build a config.
 *
 * @throws ConfigurationError listing every offending variable by name.
 */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): ApiConfig {
  const parsed = envSchema.safeParse(env);
  if (parsed.success) return Object.freeze(parsed.data);

  const problems = parsed.error.issues.map((issue) => {
    const name = issue.path.length > 0 ? issue.path.map(String).join('.') : '(environment)';
    // zod's default message for an absent key is "Required", which is accurate
    // but reads like a schema term rather than an instruction to an operator.
    const message =
      issue.code === 'invalid_type' && issue.received === 'undefined'
        ? 'is required but was not set'
        : issue.message;
    return { name, message };
  });

  // Deduplicate: a piped schema can report the same variable twice.
  const seen = new Set<string>();
  const unique = problems.filter((p) => {
    const key = `${p.name}::${p.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  throw new ConfigurationError(unique);
}

/** True when the config permits development-only conveniences. */
export function isProduction(config: ApiConfig): boolean {
  return config.NODE_ENV === 'production';
}
