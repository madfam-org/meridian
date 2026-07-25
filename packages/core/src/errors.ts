/** Domain error taxonomy. Every error carries a stable `code` for API mapping and telemetry. */

export type MeridianErrorCode =
  | 'INVALID_INPUT'
  | 'PATHWAY_NOT_FOUND'
  | 'PATHWAY_NOT_REVIEWED'
  | 'CITATION_STALE'
  | 'ADVICE_BOUNDARY'
  | 'REPRESENTATIVE_REQUIRED'
  | 'DOCUMENT_INVALID'
  | 'MRZ_PARSE_FAILED'
  | 'MRZ_CHECK_DIGIT_FAILED'
  | 'PRESENCE_LEDGER_INCONSISTENT'
  | 'ADAPTER_UNAVAILABLE'
  | 'ADAPTER_NOT_PROVISIONED'
  | 'CREDENTIAL_CUSTODY_REFUSED';

export class MeridianError extends Error {
  readonly code: MeridianErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(code: MeridianErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'MeridianError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function isMeridianError(e: unknown): e is MeridianError {
  return e instanceof MeridianError;
}
