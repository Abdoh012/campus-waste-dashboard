import BrandLockup from '../../../shared/ui/BrandLockup';
import Eyebrow from '../../../shared/ui/Eyebrow';
import LanguageSwitcher from '../../../shared/ui/LanguageSwitcher';
import { showSuccess } from '../../../shared/ui/notifications';
import { useI18n } from '../../../shared/i18n/useI18n';

/** The dashboard's snapshot date — Thursday, 17 September 2026. */
const HEADER_DATE = new Date('2026-09-17T00:00:00Z');

const EXPORT_FILE = 'campus-ops-sept-17.csv';

export default function Topbar() {
  const { t, formatDate } = useI18n();

  return (
    <header className="mb-7 flex items-start gap-6 max-sm:mb-5 max-sm:grid max-sm:grid-cols-2 max-sm:items-start max-sm:gap-x-4 max-sm:gap-y-3">
      <div className="shrink-0 max-sm:col-start-1 max-sm:row-start-1">
        <BrandLockup as="h1" />
      </div>

      <div className="me-auto min-w-0 max-sm:col-start-1 max-sm:row-start-2 max-sm:me-0">
        <Eyebrow className="uppercase">
          {formatDate(HEADER_DATE, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Eyebrow>
        <h2 className="font-heading text-2xl font-semibold tracking-tighter max-sm:text-xl">
          {t('topbar.greeting', { campus: 'BATU' })}{' '}
          <span className="ms-1 text-xl text-sun">✦</span>
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <button
          className="cursor-pointer rounded-md border-0 bg-foreground px-3.5 py-2.5 text-xs text-export-foreground max-sm:p-2 max-sm:text-2xs"
          type="button"
          onClick={() =>
            showSuccess(t('topbar.exportToast', { file: EXPORT_FILE }))
          }
        >
          {t('topbar.export')}{' '}
          <span className="ps-2 text-export-accent">↗</span>
        </button>
      </div>
    </header>
  );
}
