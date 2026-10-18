/**
 * Core localization types.
 *
 * `Locale` is the set of UI languages the app ships. Adding one means a new
 * catalog under `locales/`, an entry in `CATALOGS` and `LOCALES` (catalog.ts) —
 * and because every catalog is typed against the English one, the compiler then
 * refuses to build until the new locale defines every key.
 */

export type Locale = 'en' | 'ar';

/** Writing direction of a locale. Arabic is right-to-left. */
export type Direction = 'ltr' | 'rtl';

/** The plural categories `Intl.PluralRules` can return (Arabic uses all six). */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
