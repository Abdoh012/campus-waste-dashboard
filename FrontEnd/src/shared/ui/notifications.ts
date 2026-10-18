import { toast } from 'sonner';

/**
 * The app's notification API, ported from the React library's
 * `utils/notifications.js`.
 *
 * `showSuccess` / `showError` / `showInfo` are still the only way a feature
 * raises a notification — nothing imports `sonner` directly — so the exported
 * names, signatures and per-variant behavior survive the change of transport.
 * The library's hardcoded hex palette is the one deliberate departure: each
 * variant now resolves to the project's semantic state tokens through the
 * `<Toaster richColors />` CSS variables set in `src/App.tsx`, so notifications
 * use the same `*-bg` / `*-fg` pairs as the status chips (see `HealthAlert`)
 * instead of a parallel color set.
 *
 * Everything else matches the original contract: a five-second duration, a
 * bottom-right stack and a dismissible close button.
 */

/** How long a notification stays on screen, in milliseconds. */
const DURATION_MS = 5000;

/** Shows a success notification. */
export function showSuccess(message: string): void {
  toast.success(message, {
    duration: DURATION_MS,
    position: 'bottom-right',
    closeButton: true,
  });
}

/** Shows an error notification. */
export function showError(message: string): void {
  toast.error(message, {
    duration: DURATION_MS,
    position: 'bottom-right',
    closeButton: true,
  });
}

/** Shows an informational notification. */
export function showInfo(message: string): void {
  toast.info(message, {
    duration: DURATION_MS,
    position: 'bottom-right',
    closeButton: true,
  });
}
