import { ShieldCheck } from 'lucide-react';
import LoginForm from '../features/auth/components/LoginForm';
import BrandLockup from '../shared/ui/BrandLockup';
import Eyebrow from '../shared/ui/Eyebrow';
import { SURFACE } from '../styles/surfaces';

export interface LoginPageProps {
  onSignIn: () => void;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-6 py-12 max-sm:px-4 max-sm:py-8">
        <div>
          <BrandLockup size="lg" className="mb-6 max-sm:mb-5" />

          <section
            aria-labelledby="signin-heading"
            className={`${SURFACE} border-t-2 border-t-primary px-7 py-6 max-sm:px-5`}
          >
            <Eyebrow tone="strong">CAMPUS WASTE INTELLIGENCE</Eyebrow>
            <h1
              id="signin-heading"
              className="font-heading text-2xl font-semibold tracking-tighter"
            >
              Operator sign in
            </h1>
            <p className="mt-2 text-sm text-label-strong">
              Sign in to reach the live bin network, hardware health, and the
              student points ledger.
            </p>

            <LoginForm />

            <div className="mt-6 flex items-start gap-2 border-t border-border pt-4">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-label-strong"
                aria-hidden="true"
              />
              <p className="text-2xs text-label-strong">
                Access is limited to authorised campus operators. Need an
                account? Contact your facilities administrator.
              </p>
            </div>
          </section>

          <footer className="mt-5 flex justify-between gap-x-4 gap-y-1 px-1 font-mono text-2xs text-label-strong max-sm:flex-col">
            <span>Think Outside The Box · Campus operations</span>
            <span>Offline-first bin network</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
