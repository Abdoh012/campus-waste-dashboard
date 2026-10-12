import StatusDot from './StatusDot.jsx';

export default function PageFooter() {
  return (
    <footer className="flex justify-between px-[3px] font-mono text-[9px] text-label-muted max-[700px]:flex-col max-[700px]:gap-2">
      <span>Think Outside The Box · Campus operations dashboard</span>
      <span>
        Edge AI network <StatusDot tone="green" className="ml-[5px]" /> Operational
      </span>
    </footer>
  );
}
