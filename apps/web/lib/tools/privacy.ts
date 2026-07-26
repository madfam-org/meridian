/**
 * What the tools promise, stated once, in one place.
 *
 * Two claims are made on every tool page, and both are the kind of claim a
 * reader has no way to check for themselves unless somebody tells them where to
 * look. They are therefore written here, verbatim, and rendered by
 * `components/tools/PrivacyNote.tsx` — never paraphrased at a call site, so
 * that a change to the wording is a change to every page at once and cannot
 * drift into a promise the code does not keep.
 *
 * ── The privacy claim ────────────────────────────────────────────────────────
 *
 * "Nothing you type is sent anywhere." That is true of these tools because of
 * how they are built, and each clause below is a property of the source rather
 * than a policy someone has undertaken to follow:
 *
 *   - The engines are pure computation. `@meridian/mrtd`, `@meridian/presence`,
 *     `@meridian/pathways` and `@meridian/core` perform no I/O of any kind.
 *     They are compiled into the page's JavaScript bundle and run on the
 *     reader's own device.
 *   - The tool pages are statically prerendered. There is no server action, no
 *     route handler, no `fetch`, and no form `action` on any tool in this
 *     application — a submit handler calls `preventDefault`, so not even a
 *     navigation carries the value.
 *   - Input lives in React state and nowhere else. No `localStorage`, no
 *     `sessionStorage`, no cookie, no query string. Reloading the page loses it,
 *     which is the intended behaviour: a travel-document number in a browser
 *     history entry is a travel-document number in a shared computer's history.
 *   - This application contains no analytics, no telemetry and no third-party
 *     script. `NEXT_TELEMETRY_DISABLED=1` in `Dockerfile.web` covers the build;
 *     there is nothing to disable at runtime because nothing was added.
 *
 * Saying so matters. For a tool that takes passport data this property is
 * unusual, and a reader who is not told will reasonably assume the opposite —
 * so the statement sits beside the input, not in a footer.
 *
 * ── The advice-boundary claim ────────────────────────────────────────────────
 *
 * Everything these tools produce is `assessment`-class under
 * `@meridian/core`'s `DisclosureClass`: the reader's own facts measured against
 * a cited rule, with the arithmetic shown. `canRelease` releases that class to
 * an unrepresented applicant unconditionally, which is exactly why the tools
 * can exist at all without a licensed representative attached.
 *
 * What they must never produce is `advice` — a ranking, a recommendation, a
 * "best option", a chance-of-success estimate, or a suggestion about what to do
 * next. Under s.91 of Canada's Immigration and Refugee Protection Act and
 * Spain's reserved-activity rules that is a regulated act, and there is nobody
 * on the hook for it here.
 */

import { bi, type Bi } from '@/lib/i18n';
import { REPO_URL } from '@/lib/links';

/** Heading for the privacy box that sits beside every tool's input. */
export const PRIVACY_TITLE: Bi = bi(
  'Nothing you type here leaves your device',
  'Nada de lo que escriba aquí sale de su dispositivo',
);

/**
 * The claim, in one sentence, for places with room for only one.
 */
export const PRIVACY_LEAD: Bi = bi(
  'This tool runs entirely in your browser. What you type is never transmitted, never stored, and never written to the address bar.',
  'Esta herramienta se ejecuta íntegramente en su navegador. Lo que escribe no se transmite, no se almacena y no se escribe en la barra de direcciones.',
);

/**
 * The claim, itemised. Each line states a property of the code, not an
 * undertaking — so each line is something a reader can go and check.
 */
export const PRIVACY_POINTS: readonly Bi[] = [
  bi(
    'The check runs on your own device. The rule engine is ordinary JavaScript loaded with the page; it makes no network request with what you typed.',
    'La comprobación se ejecuta en su propio dispositivo. El motor de reglas es JavaScript corriente cargado con la página; no realiza ninguna petición de red con lo que usted escribió.',
  ),
  bi(
    'Nothing is saved. Not in local storage, not in a cookie, not in the address bar. Reload the page and it is gone.',
    'No se guarda nada. Ni en el almacenamiento local, ni en una cookie, ni en la barra de direcciones. Al recargar la página desaparece.',
  ),
  bi(
    'There is no analytics code, no telemetry and no third-party script in this application.',
    'Esta aplicación no contiene código de analítica, ni telemetría, ni scripts de terceros.',
  ),
  bi(
    'Once this page has loaded you can disconnect from the network and the tool still works.',
    'Una vez cargada esta página puede desconectarse de la red y la herramienta seguirá funcionando.',
  ),
];

/**
 * Where a sceptical reader should go to check the claim. Meridian is AGPL-3.0
 * and public, so "read the source" is a real answer rather than a deflection.
 */
export const PRIVACY_SOURCE_INVITATION: Bi = bi(
  'You do not have to take our word for it. Meridian is public source:',
  'No tiene por qué creernos sin más. El código de Meridian es público:',
);

/** Absolute link to a file in the published repository, for the invitation above. */
export function sourceUrl(repoRelativePath: string): string {
  return `${REPO_URL}/blob/main/${repoRelativePath}`;
}

/** Heading for the assessment-not-advice box. */
export const BOUNDARY_TITLE: Bi = bi(
  'These tools measure. They do not recommend.',
  'Estas herramientas miden. No recomiendan.',
);

export const BOUNDARY_BODY: Bi = bi(
  'Every result here is an assessment: your own facts measured against a published rule, with the rule named, its source shown, and the arithmetic exposed so you can check it yourself. That is all it is. These tools will not rank your options, will not tell you which route to take, and will not estimate your chance of success — those are regulated acts in Canada and in Spain, and nobody licensed is accountable for an answer a web page gives you.',
  'Todo resultado aquí es una evaluación: sus propios datos medidos frente a una norma publicada, con la norma identificada, su fuente a la vista y la aritmética expuesta para que pueda comprobarla usted mismo. Nada más. Estas herramientas no clasifican sus opciones, no le indican qué vía seguir y no estiman sus probabilidades de éxito: son actos reservados en Canadá y en España, y ninguna persona con licencia responde de una respuesta que le dé una página web.',
);

/** What a tool deliberately does not do. Shown on the index page. */
export const BOUNDARY_EXCLUSIONS: readonly Bi[] = [
  bi(
    'No ranking of routes, and no "best option".',
    'Ninguna clasificación de vías ni «mejor opción».',
  ),
  bi(
    'No estimate of your chance of success. No authority publishes the data that would make one honest.',
    'Ninguna estimación de sus probabilidades de éxito. Ninguna autoridad publica los datos que la harían honesta.',
  ),
  bi(
    'No statement that a document is genuine. Arithmetic cannot see a forgery.',
    'Ninguna afirmación de que un documento sea auténtico. La aritmética no ve una falsificación.',
  ),
  bi(
    'No advice on what to do next. That needs a representative who is accountable for it.',
    'Ningún consejo sobre qué hacer a continuación. Eso exige un representante que responda de ello.',
  ),
];
