import { useI18n } from '../i18n/useI18n';
import type { StringKey } from '../i18n/locales/en';
import { isThemePreference, THEME_ORDER } from '../theme/theme';
import type { ThemePreference } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

/** Localized label for each preference. */
const LABEL_KEYS: Record<ThemePreference, StringKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
};

export interface ThemeSwitcherProps {
  className?: string;
}

/**
 * Theme picker. A native `<select>` keeps it keyboard- and screen-reader-
 * friendly and styled like the language picker beside it. `system` follows the
 * operating system, so the option names stay self-explanatory.
 */
export default function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { preference, setPreference } = useTheme();
  const { t } = useI18n();

  return (
    <select
      aria-label={t('common.theme')}
      value={preference}
      onChange={(event) => {
        const next = event.target.value;
        if (isThemePreference(next)) setPreference(next);
      }}
      className={`cursor-pointer rounded border border-border bg-input px-2 py-1.5 font-mono text-2xs text-muted-foreground ${className}`}
    >
      {THEME_ORDER.map((code) => (
        <option key={code} value={code}>
          {t(LABEL_KEYS[code])}
        </option>
      ))}
    </select>
  );
}
