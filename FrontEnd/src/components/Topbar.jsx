import Eyebrow from './Eyebrow.jsx';

export default function Topbar({ showToast }) {
  return (
    <header className="mb-7 flex items-center justify-between max-[700px]:items-start max-[700px]:gap-[15px]">
      <div>
        <Eyebrow>THURSDAY, SEPTEMBER 17, 2026</Eyebrow>
        <h2 className="font-heading text-[25px] font-semibold tracking-[-0.04em] max-[700px]:text-[21px]">
          Good morning, BATU <span className="ml-1 text-[20px] text-sun">✦</span>
        </h2>
      </div>
      <div className="flex items-center gap-[13px] max-[700px]:gap-2">
        <div className="rounded-[20px] border border-pill-border bg-primary-tint px-[11px] py-2 font-mono text-[10px] tracking-[0.06em] text-pill-foreground max-[700px]:hidden">
          <span className="mr-[7px] inline-block h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-live-halo)]"></span>
          Live operations
        </div>
        <button className="relative border-0 bg-transparent text-[21px] text-icon-muted max-[700px]:hidden" type="button" aria-label="Notifications">
          <span className="absolute right-0 top-0 h-[5px] w-[5px] rounded-full bg-destructive"></span>♧
        </button>
        <button
          className="cursor-pointer rounded-md border-0 bg-foreground px-3.5 py-2.5 text-[12px] text-export-foreground max-[700px]:p-[9px] max-[700px]:text-[10px]"
          type="button"
          onClick={() => showToast('Report export prepared · campus-ops-sept-17.csv')}
        >
          Export report <span className="pl-2 text-export-accent">↗</span>
        </button>
      </div>
    </header>
  );
}
