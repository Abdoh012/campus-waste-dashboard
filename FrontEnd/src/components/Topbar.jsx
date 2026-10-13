import Eyebrow from "./Eyebrow.jsx";

export default function Topbar({ showToast }) {
  return (
    <header className="mb-7 flex items-start gap-6 max-[700px]:mb-5 max-[700px]:grid max-[700px]:grid-cols-[minmax(0,1fr)_auto] max-[700px]:items-start max-[700px]:gap-x-[15px] max-[700px]:gap-y-[13px]">
      {/* The brand lockup moved here from the rail. On the pale canvas it is
          re-toned for the light ground: brand-green mark, standard eyebrow,
          ink wordmark. */}
      <div className="flex shrink-0 items-start gap-3 max-[700px]:col-start-1 max-[700px]:row-start-1">
        <div
          className="flex h-[27px] items-end gap-[3px] pt-0.5"
          aria-hidden="true"
        >
          <span className="block h-4 w-[5px] rounded-[5px] bg-primary"></span>
          <span className="block h-6 w-[5px] rounded-[5px] bg-primary"></span>
          <span className="block h-[11px] w-[5px] rounded-[5px] bg-primary"></span>
        </div>
        <div>
          <p className="m-0 mb-1.5 font-mono text-[10px] tracking-[0.12em] text-eyebrow">
            SMART CAMPUS OS
          </p>
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
          Good morning, BATU{" "}
          <span className="ml-1 text-[20px] text-sun">✦</span>
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-[13px] max-[700px]:col-start-2 max-[700px]:row-start-1 max-[700px]:gap-2">
        <button
          className="cursor-pointer rounded-md border-0 bg-foreground px-3.5 py-2.5 text-[12px] text-export-foreground max-[700px]:p-[9px] max-[700px]:text-[10px]"
          type="button"
          onClick={() =>
            showToast("Report export prepared · campus-ops-sept-17.csv")
          }
        >
          Export report <span className="pl-2 text-export-accent">↗</span>
        </button>
      </div>
    </header>
  );
}
