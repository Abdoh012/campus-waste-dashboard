import StatusDot from '../../../shared/ui/StatusDot';

export default function PageFooter() {
  return (
    <footer className="flex justify-between px-1 font-mono text-2xs text-label-muted max-sm:flex-col max-sm:gap-2">
      <span>Think Outside The Box · Campus operations dashboard</span>
      <span>
        Edge AI network <StatusDot tone="green" className="ml-1" /> Operational
      </span>
    </footer>
  );
}
