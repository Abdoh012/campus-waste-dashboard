import { isLocale, LOCALE_ORDER, LOCALES } from '../i18n/catalog';
import { useI18n } from '../i18n/useI18n';

export interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Locale picker. A native `<select>` keeps it keyboard- and screen-reader-
 * friendly (and styled like the chart period selector). The visible option is
 * each language's own name, so it reads correctly whatever the active locale is.
 */
export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <select
      aria-label={t('common.language')}
      value={locale}
      onChange={(event) => {
        const next = event.target.value;
        if (isLocale(next)) setLocale(next);
      }}
      className={`cursor-pointer rounded border border-border bg-input px-2 py-1.5 font-mono text-2xs text-muted-foreground ${className}`}
    >
      {LOCALE_ORDER.map((code) => (
        <option key={code} value={code}>
          {LOCALES[code].label}
        </option>
      ))}
    </select>
  );
}
