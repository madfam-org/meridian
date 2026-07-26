/**
 * The tools this portal offers, and the one place that knows they exist.
 *
 * The index page at `/tools` renders this list; nothing else enumerates the
 * tools. Adding a tool is therefore two steps — a route under `app/tools/`, and
 * an entry here — and the index cannot silently fall out of step with what is
 * actually shipped.
 *
 * `notThis` is not decoration. Each tool states, on its own card, the question
 * a reader might reasonably think it answers and that it deliberately does not:
 * an MRZ that checks out is not a genuine passport, and a day count is not
 * permission to travel. Stating the boundary next to the offer is cheaper than
 * correcting the assumption afterwards.
 */

import { bi, type Bi } from '@/lib/i18n';

export interface ToolEntry {
  /** Stable slug, matching the route segment under `/tools`. */
  readonly id: string;
  readonly href: string;
  readonly name: Bi;
  /** One sentence: what you put in, and what you get back. */
  readonly summary: Bi;
  /** What it takes from the reader, in plain words. Shown as the input line. */
  readonly input: Bi;
  /** The nearest question it does NOT answer. */
  readonly notThis: Bi;
  /** The instrument the tool measures against, named on the card. */
  readonly rule: Bi;
}

/**
 * Ordered by how small the input is, not by importance. A visitor deciding
 * whether these tools are for them tries the cheapest one first, and the MRZ
 * check asks for two lines they can read off a page in front of them.
 *
 * There is no "recommended" or "most popular" ordering here and there must not
 * be one: a sort order is a recommendation, and a recommendation is advice.
 */
export const TOOLS: readonly ToolEntry[] = [
  {
    id: 'mrz',
    href: '/tools/mrz',
    name: bi('Machine-readable zone check', 'Comprobación de la zona de lectura mecánica'),
    summary: bi(
      'Paste the two or three code lines from the bottom of a passport or identity card. Meridian reports the format, every field it can read, and which individual check digit fails when one does.',
      'Pegue las dos o tres líneas de código de la parte inferior de un pasaporte o documento de identidad. Meridian indica el formato, todos los campos que puede leer y qué dígito de control concreto falla cuando alguno falla.',
    ),
    input: bi(
      'The machine-readable lines of a travel document',
      'Las líneas de lectura mecánica de un documento de viaje',
    ),
    notThis: bi(
      'It cannot tell you whether the document is genuine. It checks that the transcription in front of you is arithmetically self-consistent — which is what catches a mistyped or misread character before it reaches a government form.',
      'No puede decirle si el documento es auténtico. Comprueba que la transcripción que tiene delante es aritméticamente coherente consigo misma, que es lo que detecta un carácter mal tecleado o mal leído antes de que llegue a un impreso oficial.',
    ),
    rule: bi(
      'ICAO Doc 9303, Machine Readable Travel Documents',
      'Doc 9303 de la OACI, Documentos de viaje de lectura mecánica',
    ),
  },
];
