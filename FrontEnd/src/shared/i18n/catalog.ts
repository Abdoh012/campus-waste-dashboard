/**
 * The locale registry and the pure translation helpers.
 *
 * This module has no React in it: the provider (I18nProvider.tsx) wraps these
 * helpers in context, and code that runs outside React — a react-router action,
 * for instance — can call `translateNow()` directly, reading the persisted
 * locale from storage.
 */

import { en } from './locales/en';
import type { Catalog, PluralForms, PluralKey, StringKey } from './locales/en';
import { ar } from './locales/ar';
import type { Direction, Locale, PluralCategory } from './types';

/** Display metadata for each locale: its native name and writing direction. */
export const LOCALES: Record<Locale, { label: string; dir: Direction }> = {
  en: { label: 'English', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};

/** Locales in the order the switcher lists them. */
export const LOCALE_ORDER: readonly Locale[] = ['en', 'ar'];

export const CATALOGS: Record<Locale, Catalog> = { en, ar };

export const DEFAULT_LOCALE: Locale = 'en';

/** localStorage key the chosen locale is persisted under (shared with the pre-paint script in index.html). */
export const LOCALE_STORAGE_KEY = 'cw.locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar';
}

export function directionOf(locale: Locale): Direction {
  return LOCALES[locale].dir;
}

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* Storage can be unavailable (private mode, blocked cookies) — keep the in-memory locale. */
  }
}

/** The persisted locale, else the browser's preference, else English. */
export function detectLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;

  const preferred = typeof navigator !== 'undefined' ? navigator.language : '';
  return preferred.toLowerCase().startsWith('ar') ? 'ar' : DEFAULT_LOCALE;
}

export interface TranslateParams {
  readonly [name: string]: string | number;
}

/** Localized number formatting. Latin digits are kept for data legibility. */
export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale, { numberingSystem: 'latn' }).format(value);
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();

function pluralRules(locale: Locale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

/** Replaces `{name}` placeholders; numeric params are formatted for the locale. */
function interpolate(
  template: string,
  locale: Locale,
  params?: TranslateParams,
): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(locale, value) : String(value);
  });
}

export function translate(
  locale: Locale,
  key: StringKey,
  params?: TranslateParams,
): string {
  const template = CATALOGS[locale].strings[key] ?? key;
  return interpolate(template, locale, params);
}

export function translatePlural(
  locale: Locale,
  key: PluralKey,
  count: number,
  params?: TranslateParams,
): string {
  const forms: PluralForms | undefined = CATALOGS[locale].plurals[key];
  const category = pluralRules(locale).select(count) as PluralCategory;
  const template = forms?.[category] ?? forms?.other ?? key;
  return interpolate(template, locale, { count, ...params });
}

/** Translate outside React (router actions, non-component modules). */
export function translateNow(key: StringKey, params?: TranslateParams): string {
  return translate(detectLocale(), key, params);
}

/** A bound `t` function, as exposed by the provider. */
export type Translate = (key: StringKey, params?: TranslateParams) => string;

/** A bound plural `tn` function, as exposed by the provider. */
export type TranslatePlural = (
  key: PluralKey,
  count: number,
  params?: TranslateParams,
) => string;
