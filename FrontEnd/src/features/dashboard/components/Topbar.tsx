import BrandLockup from '../../../shared/ui/BrandLockup';
import Eyebrow from '../../../shared/ui/Eyebrow';
import { showSuccess } from '../../../shared/ui/notifications';

export default function Topbar() {
  return (
    <header className="mb-7 flex items-start gap-6 max-sm:mb-5 max-sm:grid max-sm:grid-cols-2 max-sm:items-start max-sm:gap-x-4 max-sm:gap-y-3">
      <div className="shrink-0 max-sm:col-start-1 max-sm:row-start-1">
        <BrandLockup as="h1" />
      </div>

      <div className="mr-auto min-w-0 max-sm:col-start-1 max-sm:row-start-2 max-sm:mr-0">
        <Eyebrow>THURSDAY, SEPTEMBER 17, 2026</Eyebrow>
        <h2 className="font-heading text-2xl font-semibold tracking-tighter max-sm:text-xl">
          Good morning, BATU{' '}
          <span className="ml-1 text-xl text-sun">✦</span>
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-3 max-sm:col-start-2 max-sm:row-start-1 max-sm:gap-2">
        <button
          className="cursor-pointer rounded-md border-0 bg-foreground px-3.5 py-2.5 text-xs text-export-foreground max-sm:p-2 max-sm:text-2xs"
          type="button"
          onClick={() =>
            showSuccess('Report export prepared · campus-ops-sept-17.csv')
          }
        >
          Export report <span className="pl-2 text-export-accent">↗</span>
        </button>
      </div>
    </header>
  );
}
