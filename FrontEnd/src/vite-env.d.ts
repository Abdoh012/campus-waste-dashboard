/// <reference types="vite/client" />

/**
 * The environment variables the app reads at build time.
 *
 * Vite only exposes variables prefixed with `VITE_`, and they are inlined into
 * the bundle — so this is configuration, never a secret. `.env.example` lists
 * the values a local checkout needs.
 */
interface ImportMetaEnv {
  /** Google Maps JavaScript API key. The map shows a setup notice when unset. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /**
   * Optional Google Maps Map ID. Advanced markers (the numbered bin markers)
   * need a map ID; without one the app falls back to Google's documented
   * `DEMO_MAP_ID`, which is fine locally but not for production.
   */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  /**
   * Base URL of the campus API. Defaults to the local Express server
   * (`http://localhost:5000/api`) when unset.
   */
  readonly VITE_API_BASE_URL?: string;
}
