/** Wordmark scale steps. `sm` is the topbar lockup; `lg` gives a page more presence. */
export type BrandLockupSize = 'sm' | 'lg';

/**
 * Element the wordmark renders as. The dashboard topbar uses `h1` (it is the
 * page heading); surfaces that own their own heading — such as the sign-in
 * page — keep the default paragraph so a page never carries two `h1`s.
 */
export type BrandLockupHeading = 'h1' | 'p';

const WORDMARK_SIZE: Record<BrandLockupSize, string> = {
  sm: 'text-base',
  lg: 'text-lg',
};

export interface BrandLockupProps {
  as?: BrandLockupHeading;
  size?: BrandLockupSize;
  /**
   * Layout classes for the lockup row. The row itself is a flex container, so
   * callers pass placement utilities (grid position, margins, `shrink-0`)
   * rather than restyling the mark or the wordmark.
   */
  className?: string;
}

/**
 * The brand lockup: the three-bar mark, the `SMART CAMPUS OS` kicker and the
 * Think Outside The Box wordmark. Shared by the dashboard topbar and the
 * sign-in page so both surfaces carry the same identity.
 */
export default function BrandLockup({
  as = 'p',
  size = 'sm',
  className = '',
}: BrandLockupProps) {
  const Wordmark = as;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-7 items-end gap-1 pt-0.5" aria-hidden="true">
        <span className="block h-4 w-1 rounded bg-primary"></span>
        <span className="block h-6 w-1 rounded bg-primary"></span>
        <span className="block h-3 w-1 rounded bg-primary"></span>
      </div>
      <div>
        <p className="m-0 mb-1.5 font-mono text-2xs tracking-widest text-eyebrow">
          SMART CAMPUS OS
        </p>
        <Wordmark
          className={`font-heading ${WORDMARK_SIZE[size]} font-semibold leading-tight tracking-tight`}
        >
          Think Outside
          <br />
          The Box
        </Wordmark>
      </div>
    </div>
  );
}
