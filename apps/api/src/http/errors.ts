/**
 * The error surface.
 *
 * One envelope for every failure, one place that decides a status code, and a
 * strict rule about what may appear in a message.
 *
 * The rule: an error body may name *what* was wrong, never *what was sent*. A
 * validation failure says `body.mrz: expected a string`, not the MRZ. A failed
 * lookup says the id was not found in this tenant, and says it identically
 * whether the row is absent or belongs to somebody else — a 403 on another
 * tenant's matter id confirms the matter exists, which is itself the leak.
 *
 * `MeridianError` codes come from `@meridian/core` and carry their own meaning;
 * this module maps them to HTTP rather than re-inventing them, so a domain
 * package can add a code and get a sensible status without editing a route.
 */

import { MeridianError, isMeridianError, type MeridianErrorCode } from '@meridian/core';
import { z } from 'zod';

/** Codes this layer originates, distinct from the domain codes in `@meridian/core`. */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  /** A route tried to return engine output without passing the disclosure gate. */
  | 'DISCLOSURE_GATE_BYPASSED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'INTERNAL';

export interface ErrorBody {
  readonly error: {
    readonly code: ApiErrorCode | MeridianErrorCode;
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function unauthenticated(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(401, 'UNAUTHENTICATED', message, details);
}

export function forbidden(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(403, 'FORBIDDEN', message, details);
}

/**
 * The only way this API reports a resource it will not show you.
 *
 * Deliberately the same response for "no such row" and "that row belongs to
 * another tenant". Distinguishing them turns the id space into an oracle.
 */
export function notFound(resource: string, id: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `No ${resource} with id ${JSON.stringify(id)} in this tenant.`, {
    resource,
  });
}

export function conflict(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(409, 'CONFLICT', message, details);
}

export function validationFailed(
  where: 'body' | 'params' | 'query' | 'response',
  error: z.ZodError,
): ApiError {
  return new ApiError(
    where === 'response' ? 500 : 400,
    'VALIDATION_FAILED',
    where === 'response'
      ? 'The response this route produced does not match its declared schema.'
      : `Request ${where} failed validation.`,
    {
      where,
      // Paths and messages only. Never `issue.received` — that is the caller's
      // data, and the caller's data is exactly what must not be echoed.
      issues: error.issues.map((i) => ({
        path: i.path.map(String).join('.'),
        message: i.message,
      })),
    },
  );
}

const MERIDIAN_STATUS: Readonly<Record<MeridianErrorCode, number>> = {
  INVALID_INPUT: 400,
  PATHWAY_NOT_FOUND: 404,
  // The rules exist and were read; they have not been signed off. That is a
  // state conflict, not a missing resource, and the client can act on it.
  PATHWAY_NOT_REVIEWED: 409,
  CITATION_STALE: 409,
  ADVICE_BOUNDARY: 403,
  REPRESENTATIVE_REQUIRED: 403,
  DOCUMENT_INVALID: 400,
  MRZ_PARSE_FAILED: 400,
  MRZ_CHECK_DIGIT_FAILED: 400,
  PRESENCE_LEDGER_INCONSISTENT: 409,
  ADAPTER_UNAVAILABLE: 503,
  // Not an error in the code — an honest statement that the integration has
  // never been provisioned. 501 is the only status that says that truthfully.
  ADAPTER_NOT_PROVISIONED: 501,
  CREDENTIAL_CUSTODY_REFUSED: 403,
};

export function statusForMeridianError(error: MeridianError): number {
  return MERIDIAN_STATUS[error.code];
}

/** Everything a handler can throw, rendered into one shape. */
export function toErrorResponse(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(Object.keys(error.details).length > 0 ? { details: error.details } : {}),
        },
      },
    };
  }

  if (isMeridianError(error)) {
    return {
      status: statusForMeridianError(error),
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(Object.keys(error.details).length > 0 ? { details: error.details } : {}),
        },
      },
    };
  }

  if (error instanceof z.ZodError) {
    return toErrorResponse(validationFailed('body', error));
  }

  // Anything else is a fault we did not anticipate. The client learns nothing
  // about it; the log line carries the stack.
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL',
        message: 'The request could not be completed.',
      },
    },
  };
}

/**
 * Parse untrusted input, converting a zod failure into the API's own error.
 *
 * Generic over the schema rather than over an output type, so that a schema with
 * a transform — a language tag normalised to a branded `LanguageTag`, a date
 * validated into an `IsoDate` — yields the *transformed* type. Writing this as
 * `z.ZodType<T>` would let inference fall back to the pre-transform input type,
 * and every branded value downstream would silently become a bare string.
 */
export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  where: 'body' | 'params' | 'query',
): z.infer<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw validationFailed(where, parsed.error);
  return parsed.data;
}
