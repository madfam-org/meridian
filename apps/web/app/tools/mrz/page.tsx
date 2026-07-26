/**
 * `/tools/mrz` — the machine-readable zone check.
 *
 * A server component that renders the page's framing and then hands off to
 * `MrzTool`, which is where the interaction and the computation live. The split
 * is deliberate: `metadata` can only be exported from a server component, and
 * keeping the prose here means the part that ships to the browser is the part
 * that has to.
 *
 * Nothing on this route reads a request, a cookie, a header or a search
 * parameter, so Next prerenders it as static HTML. There is no server-side
 * handler that could receive what the reader types even by accident.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { bi } from '@/lib/i18n';
import { TInline, TProse } from '@/components/Bilingual';
import { Page, PageHeader, Section } from '@/components/Layout';
import { MrzTool } from '@/components/tools/MrzTool';

export const metadata: Metadata = {
  title: 'Machine-readable zone check',
  description:
    'Check the machine-readable lines of a passport or identity card against ICAO Doc 9303: the ' +
    'format, every parsed field, and which individual check digit fails. Runs entirely in your ' +
    'browser — nothing you type is transmitted or stored.',
};

export default function MrzToolPage() {
  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href="/tools">
            <TInline text={bi('Tools', 'Herramientas')} />
          </Link>
        }
        title={bi('Machine-readable zone check', 'Comprobación de la zona de lectura mecánica')}
        lead={bi(
          'The machine-readable zone is the only part of a travel document that can be checked for internal consistency without asking anybody anything. It carries its own check digits, so a single mistyped or misread character can be caught before the document number reaches a government form — where one wrong character costs months.',
          'La zona de lectura mecánica es la única parte de un documento de viaje que puede comprobarse consigo misma sin preguntar a nadie. Lleva sus propios dígitos de control, de modo que un solo carácter mal tecleado o mal leído puede detectarse antes de que el número de documento llegue a un impreso oficial, donde un carácter equivocado cuesta meses.',
        )}
      />

      <Section
        id="what-this-is"
        title={bi('What a clean result means', 'Qué significa un resultado limpio')}
      >
        <TProse
          text={bi(
            'It means the transcription in front of you is arithmetically self-consistent: every check digit matches the field it covers, and the dates name days that exist. It does not mean the document is genuine, and it cannot — a forged document with correctly computed check digits passes this check exactly as a real one does. What this catches is the far more common problem: a character misread by an optical scan or mistyped by a person.',
            'Significa que la transcripción que tiene delante es aritméticamente coherente consigo misma: cada dígito de control coincide con el campo que cubre y las fechas nombran días que existen. No significa que el documento sea auténtico, y no puede significarlo: un documento falsificado con dígitos de control bien calculados supera esta comprobación igual que uno real. Lo que sí detecta es el problema mucho más frecuente: un carácter mal leído por un escáner óptico o mal tecleado por una persona.',
          )}
        />
      </Section>

      <MrzTool />
    </Page>
  );
}
