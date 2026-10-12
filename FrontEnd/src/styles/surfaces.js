/**
 * Shared surface recipe (the panel / metric-card shell).
 *
 * The design gives every card the same background, border, radius and shadow;
 * this keeps that combination in one place instead of repeating it in JSX.
 */
export const SURFACE = 'rounded-[10px] border border-border bg-card shadow-card';
