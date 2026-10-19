import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ThemeContextValue } from './ThemeProvider';

/**
 * The active theme plus the setter. Throws when used outside a
 * `<ThemeProvider>`, so a missing provider fails loudly instead of silently
 * rendering the wrong theme.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }

  return context;
}
