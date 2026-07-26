'use client';

/**
 * Keyboard navigation.
 *
 * A caseload console is used all day by people who type faster than they point,
 * so the chords are the ones that muscle memory already knows from mail and
 * issue trackers: `g` then a section letter to navigate, `/` to jump to the
 * filter on the current page.
 *
 * Three rules keep it from becoming a hazard:
 *
 *  - It never fires while the user is typing. An editable target, or any
 *    modifier key, hands the event straight back.
 *  - The `g` prefix expires. A stale prefix that swallowed the next keystroke
 *    minutes later would be worse than no shortcut at all.
 *  - It adds nothing that is not reachable another way. Every destination is in
 *    the navigation and every filter has a visible field; this is an
 *    accelerator, not a hidden interface.
 *
 * The chords are printed in the page footer rather than behind a help dialog,
 * because a shortcut you cannot find is a shortcut you do not have.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CHORD_TIMEOUT_MS, QUICK_FILTER_ATTRIBUTE } from '@/components/constants';
import { CONSOLE_ROUTES } from '@/components/routes';
import { localizedPath, publicPath, splitLocalePath } from '@/lib/i18n';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION';
}

export function KeyboardNav({ asOfQuery }: { asOfQuery: string }) {
  const router = useRouter();
  // A chord must not change the reader's language. Deriving the locale from the
  // current path rather than taking it as a prop keeps it correct after a client
  // navigation, which is the only kind this component ever performs.
  const { locale } = splitLocalePath(publicPath(usePathname()));
  const armedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const disarm = (): void => {
      armedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditable(event.target)) return;

      if (armedRef.current) {
        const route = CONSOLE_ROUTES.find((r) => r.key === event.key.toLowerCase());
        disarm();
        if (route !== undefined) {
          event.preventDefault();
          router.push(`${localizedPath(route.href, locale)}${asOfQuery}`);
        }
        return;
      }

      if (event.key === 'g') {
        armedRef.current = true;
        timerRef.current = setTimeout(disarm, CHORD_TIMEOUT_MS);
        return;
      }

      if (event.key === '/') {
        const field = document.querySelector(`[${QUICK_FILTER_ATTRIBUTE}]`);
        if (field instanceof HTMLElement) {
          event.preventDefault();
          field.focus();
          if (field instanceof HTMLInputElement) field.select();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      disarm();
    };
  }, [router, asOfQuery, locale]);

  return null;
}
