export type StatusTone = 'green' | 'yellow' | 'red';

const TONES: Record<StatusTone, string> = {
  green: 'bg-success-500',
  yellow: 'bg-warning-500',
  red: 'bg-error-500',
};

export interface StatusDotProps {
  tone?: StatusTone;
  className?: string;
}

export default function StatusDot({ tone = 'green', className = '' }: StatusDotProps) {
  return (
    <i className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${TONES[tone]} ${className}`} />
  );
}
