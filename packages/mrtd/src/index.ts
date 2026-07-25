/**
 * `@meridian/mrtd` — ICAO Doc 9303 machine-readable travel documents.
 *
 * Pure computation. No runtime dependencies beyond the Node standard library,
 * no dependency on the rest of Meridian, no I/O, no clock except the one
 * default reference date you are encouraged to override.
 *
 * It exists because identity is the first gate in every migration matter, and
 * the MRZ is the only part of a travel document that can be checked for
 * internal consistency without asking anybody anything. Getting a clean verdict
 * from {@link validateMrz} does not mean a document is genuine — it means the
 * transcription in front of you is arithmetically self-consistent, which is the
 * necessary first step before a document number ends up on a government form
 * where a single wrong character costs months.
 *
 * The usual entry point:
 *
 * ```ts
 * const result = validateMrz(scannedText, { referenceDate: '2026-07-25' });
 * if (!result.valid) {
 *   for (const failure of result.failures) {
 *     console.error(failure.code, failure.field, failure.line, failure.column);
 *   }
 * }
 * ```
 */

export * from './types.js';
export * from './check-digit.js';
export * from './dates.js';
export * from './parse.js';
export * from './validate.js';
export * from './bac.js';
