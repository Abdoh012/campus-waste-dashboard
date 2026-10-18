import StatusDot from '../../../shared/ui/StatusDot';
import { useI18n } from '../../../shared/i18n/useI18n';

export default function PageFooter() {
  const { t } = useI18n();

  return (
    <footer className="flex justify-between px-1 font-mono text-2xs text-label-muted max-sm:flex-col max-sm:gap-2">
      <span>{t('footer.dashboard')}</span>
      <span>
        {t('footer.edgeNetwork')}
        <StatusDot tone="green" className="ms-1" /> {t('footer.operational')}
      </span>
    </footer>
  );
}
