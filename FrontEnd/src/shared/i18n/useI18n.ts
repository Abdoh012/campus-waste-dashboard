import { useContext } from 'react';
import { I18nContext } from './I18nProvider';
import type { I18nContextValue } from './I18nProvider';

/**
 * The active locale plus the translation helpers. Throws when used outside an
 * `<I18nProvider>`, so a missing provider fails loudly instead of silently
 * rendering keys.
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }

  return context;
}
