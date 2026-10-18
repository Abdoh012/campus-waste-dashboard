import { ShieldCheck } from 'lucide-react';
import LoginForm from '../features/auth/components/LoginForm';
import BrandLockup from '../shared/ui/BrandLockup';
import Eyebrow from '../shared/ui/Eyebrow';
import LanguageSwitcher from '../shared/ui/LanguageSwitcher';
import { useI18n } from '../shared/i18n/useI18n';
import { SURFACE } from '../styles/surfaces';

export interface LoginPageProps {
  onSignIn: () => void;
}

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="absolute end-4 top-4 z-10">
        <LanguageSwitcher />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-12 max-sm:px-4 max-sm:py-8">
        <div>
          <BrandLockup size="lg" className="mb-6 max-sm:mb-5" />

          <section
            aria-labelledby="signin-heading"
            className={`${SURFACE} border-t-2 border-t-primary px-7 py-6 max-sm:px-5`}
          >
            <Eyebrow tone="strong">{t('auth.kicker')}</Eyebrow>
            <h1
              id="signin-heading"
              className="font-heading text-2xl font-semibold tracking-tighter"
            >
              {t('auth.title')}
            </h1>
            <p className="mt-2 text-sm text-label-strong">{t('auth.subtitle')}</p>

            <LoginForm />

            <div className="mt-6 flex items-start gap-2 border-t border-border pt-4">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-label-strong"
                aria-hidden="true"
              />
              <p className="text-2xs text-label-strong">{t('auth.security')}</p>
            </div>
          </section>

          <footer className="mt-5 flex justify-between gap-x-4 gap-y-1 px-1 font-mono text-2xs text-label-strong max-sm:flex-col">
            <span>{t('auth.footer.publisher')}</span>
            <span>{t('auth.footer.tagline')}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
