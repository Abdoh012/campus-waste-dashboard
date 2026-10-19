/**
 * Theme model and its DOM side effects.
 *
 * Mirrors the i18n layer: a dependency-free, typed module with no React in it,
 * so the pre-paint script in index.html and the React provider share one source
 * of truth for the storage key, the preference set and the resolution rules.
 *
 * The product ships a light and a dark theme; the token layer keys the dark one
 * on `html.dark` (see styles/theme.css).
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key the chosen theme is kept under (kept in sync with index.html). */
export const THEME_STORAGE_KEY = 'cw.theme';

/** A first-time visitor follows the operating system. */
export const DEFAULT_THEME: ThemePreference = 'system';

/** Preferences in the order the switcher lists them. */
export const THEME_ORDER: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Browser-chrome colour (`<meta name="theme-color">`) per resolved theme. */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#10251f',
  dark: '#0d1a16',
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredTheme(): ThemePreference | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* Storage can be unavailable (private mode, blocked cookies) — keep the in-memory preference. */
  }
}

/** The persisted preference, else `system`. */
export function detectTheme(): ThemePreference {
  return readStoredTheme() ?? DEFAULT_THEME;
}

/** Whether the operating system currently asks for a dark UI. */
export function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Collapse a preference into the theme actually applied. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/**
 * Reflect a resolved theme on the document. The `.dark` class is what the token
 * layer keys on; `color-scheme` themes native controls (scrollbars, form
 * widgets) and the theme-color meta keeps the browser chrome in step.
 */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[theme]);
}
