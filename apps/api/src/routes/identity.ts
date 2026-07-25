/**
 * MRZ validation.
 *
 * **Nothing here is persisted. Not the MRZ, not one field derived from it.**
 *
 * The zone carries a document number, a name, a nationality, a date of birth and
 * a sex marker — the densest concentration of identity data anywhere in a
 * migration file. This endpoint exists to answer one question: is the
 * transcription in front of you arithmetically self-consistent, so that the
 * number about to be typed onto a government form is the number actually on the
 * document. Answering that needs no storage at all, and storing it would create
 * a second copy of somebody's passport data in a system that does not need one.
 *
 * So: the MRZ is read from the request, validated in memory, and the verdict is
 * returned. No repository is touched. The audit event records that a validation
 * happened and whether it passed — not the format, not the failure fields, not a
 * count. Even the document type is a fact about a person's document, and the
 * trail is never deleted.
 *
 * The verdict itself is returned in full, including the parsed fields, because
 * they are the caller's own input read back with the check digits verified —
 * that is the entire point, and a caseworker who cannot see which field failed
 * cannot fix it.
 *
 * Classification is `information`. The MRZ standard is ICAO Doc 9303 and
 * `@meridian/mrtd` encodes no legal rule and emits no `Citation`, so this is not
 * an assessment against law: it is the standard's own arithmetic, reported back.
 * It still passes through the gate, because every response carrying engine
 * output leaves by the same door.
 */

import { disclosable } from '@meridian/core';
import { validateMrz } from '@meridian/mrtd';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { engineOutput } from '../disclosure/envelope.js';
import { parseOrThrow } from '../http/errors.js';
import { isoDateSchema } from '../http/schemas.js';
import { requestContext } from '../request-context.js';
import { declare, resolveAsOf } from './helpers.js';

const mrzSchema = z.object({
  /**
   * The raw zone. Two or three lines, separated by newlines or supplied
   * unbroken — `@meridian/mrtd` normalises both. Capped generously: the longest
   * layout is three lines of thirty characters.
   */
  mrz: z.string().min(1).max(400),
  /**
   * Fixes the century-resolution window. Supply it whenever the result has to be
   * reproducible: a two-digit year is ambiguous, and an assessment re-run in
   * five years must reach the answer it reached today.
   */
  referenceDate: isoDateSchema.optional(),
});

export function registerIdentityRoutes(app: FastifyInstance): void {
  app.post(
    '/v1/identity/mrz',
    declare({
      summary: 'Validate a machine-readable zone. The MRZ is never stored.',
      engineOutput: true,
      access: 'authenticated',
    }),
    async (request) => {
      const ctx = requestContext(request);
      const body = parseOrThrow(mrzSchema, request.body, 'body');
      const referenceDate = resolveAsOf(ctx, body.referenceDate);

      const validation = validateMrz(body.mrz, { referenceDate });

      // No detail. Whether it passed is a fact about the operation; everything
      // else — the format, which check digit failed, how many failures there
      // were — is a fact about a person's travel document.
      await ctx.audit.record({
        action: 'identity.mrz.validated',
        targetType: 'mrz',
        targetId: null,
        outcome: validation.valid ? 'success' : 'failure',
        disclosureClass: 'information',
      });

      return engineOutput({
        subject: 'mrz_validation',
        disclosable: disclosable('information', { referenceDate, validation }, []),
        jurisdiction: ctx.tenant.homeJurisdiction,
        matterId: null,
      });
    },
  );
}
