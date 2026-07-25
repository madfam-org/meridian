/**
 * BAC key seed derivation — and a clear statement of where this stops.
 *
 * A chipped travel document will not talk to a reader that cannot prove it has
 * physically seen the document. Basic Access Control establishes that proof
 * from three values printed in the machine-readable zone: the document number,
 * the date of birth, and the date of expiry, each followed by its check digit.
 * Those twenty-four characters are the "MRZ information"; their SHA-1 digest,
 * truncated to sixteen bytes, is the key seed from which the session keys are
 * derived.
 *
 * **This module computes the seed and nothing else.** It does not implement
 * BAC, PACE, Chip Authentication, or Passive Authentication, and it must not
 * grow to. Those protocols need a live APDU channel to an ISO 14443 card, and
 * Passive Authentication additionally needs the CSCA/Document Signer
 * certificate chain, a current CRL, and a trust store — none of which belong in
 * a stateless computation library. They belong in the mobile client that
 * actually holds the NFC radio and can fail the read in the user's hand.
 *
 * Two things worth stating plainly:
 *
 * 1. SHA-1 and 3DES are used here because the BAC specification says so, not
 *    because anyone chose them. BAC's entropy ceiling is the printed MRZ, which
 *    is low and guessable for states that issue sequential document numbers;
 *    PACE exists because of that and is the protocol to prefer wherever the
 *    document supports it. Deriving a BAC seed is not a security claim.
 * 2. A key seed is derived from data that identifies a specific person's
 *    passport. Treat the inputs and the output as personal data: do not log
 *    them, do not persist them, and do not send them anywhere the document
 *    itself is not already going.
 */

import { createHash } from 'node:crypto';
import { computeCheckDigit, MRZ_FILLER } from './check-digit.js';

/** Characters of MRZ information: 9 + 1 document number, 6 + 1 each for two dates. */
const MRZ_INFORMATION_LENGTH = 24;

/** Bytes of the SHA-1 digest that form the key seed. */
export const BAC_KEY_SEED_BYTES = 16;

function assertYymmdd(value: string, label: string): void {
  if (value.length !== 6) {
    throw new RangeError(`${label} must be six characters (YYMMDD), got ${JSON.stringify(value)}`);
  }
}

/**
 * Build the MRZ information string for BAC key derivation.
 *
 * Each of the three inputs is followed by its own Doc 9303 check digit. The
 * document number is padded to nine characters with the filler when it is
 * shorter; padding does not change the check digit, because the filler scores
 * zero.
 *
 * **Document numbers longer than nine characters.** The MRZ carries these split
 * across two fields, and the reading taken here is that the key seed uses the
 * *complete* number followed by the check digit for the complete number — which
 * is the same pair of values the extended encoding writes into the zone.
 * Implementations in the field have not always agreed on this, so a client that
 * gets a BAC failure on such a document should retry with the nine-character
 * prefix and its own check digit before concluding the chip is unreadable. The
 * ambiguity is in the deployed population of documents, not in this function.
 *
 * @param documentNumber the complete number, as
 *   {@link import('./types.js').MrzDocument.documentNumber} reports it.
 * @param dateOfBirth six characters, `YYMMDD`, exactly as printed in the MRZ.
 * @param dateOfExpiry six characters, `YYMMDD`, exactly as printed in the MRZ.
 * @throws {RangeError} when a date is not six characters, or the document
 *   number is empty.
 * @throws {import('./check-digit.js').MrzCharacterError} when any input holds a
 *   character outside the MRZ alphabet. Passing lowercase here is a bug, not
 *   something to normalise away: the seed must be derived from the characters
 *   the chip was personalised with.
 */
export function mrzInformation(
  documentNumber: string,
  dateOfBirth: string,
  dateOfExpiry: string,
): string {
  if (documentNumber.length === 0) {
    throw new RangeError('document number must not be empty');
  }
  assertYymmdd(dateOfBirth, 'date of birth');
  assertYymmdd(dateOfExpiry, 'date of expiry');

  const numberField =
    documentNumber.length >= 9
      ? documentNumber
      : documentNumber + MRZ_FILLER.repeat(9 - documentNumber.length);

  return (
    numberField +
    String(computeCheckDigit(numberField)) +
    dateOfBirth +
    String(computeCheckDigit(dateOfBirth)) +
    dateOfExpiry +
    String(computeCheckDigit(dateOfExpiry))
  );
}

/**
 * The BAC key seed: the first sixteen bytes of the SHA-1 of the MRZ
 * information.
 *
 * The input is ASCII by construction — the MRZ alphabet is a subset — so the
 * bytes hashed are unambiguous regardless of platform encoding defaults.
 *
 * The seed is where this package's involvement ends. Turning it into the
 * encryption and MAC keys, running the mutual-authenticate exchange, and
 * verifying the document signer's signature over the data groups all happen in
 * the client that holds the card.
 *
 * @throws {RangeError} when `mrzInfo` is not the 24 characters
 *   {@link mrzInformation} produces for a nine-character document number, and
 *   the caller has not opted into a longer string by passing one built for an
 *   extended number. Longer inputs are accepted; shorter ones are rejected,
 *   because a truncated MRZ information string silently derives a wrong key
 *   that fails at the card with an opaque error.
 */
export function deriveBacKeySeed(mrzInfo: string): Uint8Array {
  if (mrzInfo.length < MRZ_INFORMATION_LENGTH) {
    throw new RangeError(
      `MRZ information must be at least ${MRZ_INFORMATION_LENGTH} characters, got ${mrzInfo.length}`,
    );
  }
  const digest = createHash('sha1').update(mrzInfo, 'ascii').digest();
  return new Uint8Array(digest.subarray(0, BAC_KEY_SEED_BYTES));
}
