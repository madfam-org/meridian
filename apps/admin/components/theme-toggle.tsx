'use client';

/**
 * Theme control.
 *
 * Three states rather than two, and the distinction matters: `system` is not
 * "light", it is "follow the operating system", and collapsing it into a boolean
 * means a user who switches their OS to dark at dusk stops being followed.
 *
 * The stored preference is applied by a small blocking script in the document
 * head (see `layout.tsx`), before first paint. This component only writes the
 * preference and reflects it. Rendering is deferred until after mount because
 * the server cannot know what is in `localStorage`, and guessing produces a
 * hydration mismatch on the one control whose whole job is to be correct about
 * what the user chose.
 */

import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '@/components/constants';
import type { Bi, Locale } from '@/lib/i18n';
import { UI, pick } from '@/lib/i18n';
import styles from '@/components/shell.module.css';

type ThemeChoice = 'system' | 'light' | 'dark';

const CHOICES: readonly { value: ThemeChoice; label: Bi }[] = [
  { value: 'system', label: UI.themeSystem },
  { value: 'light', label: UI.themeLight },
  { value: 'dark', label: UI.themeDark },
];

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

function readStored(): ThemeChoice {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // Private browsing, or storage disabled. Following the system is the correct
    // fallback, and the control still works for the current page.
  }
  return 'system';
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    setChoice(readStored());
  }, []);

  const onChange = (next: ThemeChoice): void => {
    setChoice(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The choice still applies to this document; it just will not persist.
    }
  };

  return (
    <div className={styles.asOfForm}>
      <label htmlFor="theme-choice">{pick(UI.themeLabel, locale)}</label>
      <select
        id="theme-choice"
        value={choice ?? 'system'}
        onChange={(event) => onChange(event.target.value as ThemeChoice)}
      >
        {CHOICES.map((option) => (
          <option key={option.value} value={option.value}>
            {pick(option.label, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
