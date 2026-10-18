/**
 * Localization provider: holds the active locale, keeps `<html lang/dir>` in
 * sync, and exposes the translation helpers to the tree.
 *
 * The chosen locale is persisted (localStorage) and re-detected from the
 * browser on first visit — see catalog.ts. The pre-paint script in index.html
 * reads the same key so the first frame is already in the right language and
 * direction (no flash of LTR content).
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  detectLocale,
  directionOf,
  formatNumber as formatNumberFor,
  storeLocale,
  translate,
  translatePlural,
} from './catalog';
import type { Translate, TranslatePlural, TranslateParams } from './catalog';
import type { Direction, Locale } from './types';

export interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  /** Translate a string key, interpolating `{placeholders}`. */
  t: Translate;
  /** Translate a plural key for a count, using `Intl.PluralRules`. */
  tn: TranslatePlural;
  /** Locale-aware number formatting (Latin digits). */
  formatNumber: (value: number) => string;
  /** Locale-aware date formatting. */
  formatDate: (value: Date, options?: Intl.DateTimeFormatOptions) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: ReactNode;
  /** Overrides the detected locale — used by tests and stories. */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? detectLocale(),
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  const dir = directionOf(locale);

  // Reflect the locale on the document: language, direction and title.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    document.title = translate(locale, 'app.title');
  }, [locale, dir]);

  const t = useCallback<Translate>(
    (key, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const tn = useCallback<TranslatePlural>(
    (key, count, params?: TranslateParams) =>
      translatePlural(locale, key, count, params),
    [locale],
  );

  const formatNumber = useCallback(
    (value: number) => formatNumberFor(locale, value),
    [locale],
  );

  const formatDate = useCallback(
    (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, {
        numberingSystem: 'latn',
        ...options,
      }).format(value),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, setLocale, t, tn, formatNumber, formatDate }),
    [locale, dir, setLocale, t, tn, formatNumber, formatDate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { DEFAULT_LOCALE };
