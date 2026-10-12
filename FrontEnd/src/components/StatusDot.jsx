const TONES = {
  green: 'bg-success-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
};

/**
 * Small filled status dot used in legends, metric footers and the page footer.
 */
export default function StatusDot({ tone = 'green', className = '' }) {
  return (
    <i className={`mr-1 inline-block h-[7px] w-[7px] rounded-full ${TONES[tone] ?? TONES.green} ${className}`} />
  );
}
