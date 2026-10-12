import Eyebrow from './Eyebrow.jsx';

export default function Topbar({ showToast }) {
  return (
    <header className="mb-7 flex items-start gap-6 max-[700px]:mb-5 max-[700px]:grid max-[700px]:grid-cols-[minmax(0,1fr)_auto] max-[700px]:items-start max-[700px]:gap-x-[15px] max-[700px]:gap-y-[13px]">
      {/* The brand lockup moved here from the rail. On the pale canvas it is
          re-toned for the light ground: brand-green mark, standard eyebrow,
          ink wordmark. */}
      <div className="flex shrink-0 items-start gap-3 max-[700px]:col-start-1 max-[700px]:row-start-1">
        <div className="flex h-[27px] items-end gap-[3px] pt-0.5" aria-hidden="true">
          <span className="block h-4 w-[5px] rounded-[5px] bg-primary"></span>
          <span className="block h-6 w-[5px] rounded-[5px] bg-primary"></span>
          <span className="block h-[11px] w-[5px] rounded-[5px] bg-primary"></span>
        </div>
        <div>
          <p className="m-0 mb-1.5 font-mono text-[10px] tracking-[0.12em] text-eyebrow">SMART CAMPUS OS</p>
          <h1 className="font-heading text-[17px] font-semibold leading-[1.12] tracking-[-0.03em]">
            Think Outside
            <br />
            The Box
          </h1>
        </div>
      </div>

      <div className="mr-auto min-w-0 max-[700px]:col-start-1 max-[700px]:row-start-2 max-[700px]:mr-0">
        <Eyebrow>THURSDAY, SEPTEMBER 17, 2026</Eyebrow>
        <h2 className="font-heading text-[25px] font-semibold tracking-[-0.04em] max-[700px]:text-[21px]">
          Good morning, BATU <span className="ml-1 text-[20px] text-sun">✦</span>
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-[13px] max-[700px]:col-start-2 max-[700px]:row-start-1 max-[700px]:gap-2">
        <div className="rounded-[20px] border border-pill-border bg-primary-tint px-[11px] py-2 font-mono text-[10px] tracking-[0.06em] text-pill-foreground max-[700px]:hidden">
          <span className="mr-[7px] inline-block h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-live-halo)]"></span>
          Live operations
        </div>
        {/* Network health, promoted from the bottom dock. The dot carries the
            state at every width; the labelled block is its arm's-length form,
            separated from the pill by a hairline rather than a full border. */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border max-[700px]:hidden"></span>
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-live shadow-[0_0_0_4px_var(--color-live-halo)]"
          ></span>
          <span className="sr-only">Network online · Last sync 32 sec ago</span>
          <div aria-hidden="true" className="max-[700px]:hidden">
            <strong className="block text-[12px] font-semibold leading-none">Network online</strong>
            <small className="mt-[5px] block font-mono text-[9px] leading-none text-label tabular-nums">
              Last sync · 32 sec ago
            </small>
          </div>
        </div>
        <button className="relative border-0 bg-transparent text-[21px] text-icon-muted max-[700px]:hidden" type="button" aria-label="Notifications">
          <span className="absolute right-0 top-0 h-[5px] w-[5px] rounded-full bg-destructive"></span>♧
        </button>
        {/* The rail's admin identity row, collapsed to its initials disc. */}
        <button
          className="grid h-[31px] w-[31px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-sidebar-avatar text-[10px] text-sidebar-avatar-foreground"
          type="button"
          aria-label="Admin · Campus ops"
        >
          AM
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
