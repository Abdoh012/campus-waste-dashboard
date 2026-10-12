/**
 * The small monospace kicker used above headings throughout the dashboard.
 */
export default function Eyebrow({ children, className = '' }) {
  return (
    <p className={`m-0 mb-[7px] font-mono text-[10px] tracking-[0.12em] text-eyebrow ${className}`}>
      {children}
    </p>
  );
}
