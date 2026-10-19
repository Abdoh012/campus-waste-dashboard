/**
 * Theme provider: holds the chosen preference, resolves it to the theme in
 * effect, and reflects it on `<html>` (`dark` class + `color-scheme`).
 *
 * The choice is persisted (localStorage) and defaults to the operating system,
 * which it keeps following live until the user picks an explicit theme. The
 * pre-paint script in index.html reads the same key so the first frame already
 * has the right theme (no flash of light content).
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_THEME,
  applyTheme,
  detectTheme,
  resolveTheme,
  storeTheme,
} from './theme';
import type { ResolvedTheme, ThemePreference } from './theme';

export interface ThemeContextValue {
  /** The stored choice — `system` follows the operating system. */
  preference: ThemePreference;
  /** The theme actually in effect right now. */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Overrides the detected preference — used by tests and stories. */
  initialTheme?: ThemePreference;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => initialTheme ?? detectTheme(),
  );
  const [theme, setTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(initialTheme ?? detectTheme()),
  );

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    storeTheme(next);
  }, []);

  // Apply the effective theme whenever the choice (not the OS) changes.
  useEffect(() => {
    const next = resolveTheme(preference);
    setTheme(next);
    applyTheme(next);
  }, [preference]);

  // While following the system, react to the OS toggling its colour scheme.
  useEffect(() => {
    if (preference !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = resolveTheme('system');
      setTheme(next);
      applyTheme(next);
    };

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { DEFAULT_THEME };
