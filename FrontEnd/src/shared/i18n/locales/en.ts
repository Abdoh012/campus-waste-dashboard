/**
 * English message catalog — the canonical one.
 *
 * Its key set is the source of truth: `Catalog` (below) derives the string and
 * plural keys from this object, so every other locale is a `Record` over exactly
 * these keys. A missing translation is a compile error; an unknown key is an
 * error too.
 *
 * Conventions:
 *   * `strings` — plain messages. `{name}` placeholders are interpolated with
 *     `t()`, and numeric params are formatted with the active locale.
 *   * `plurals` — messages whose form depends on a count. `other` is required;
 *     `Intl.PluralRules` picks the form (English uses `one`/`other`; Arabic uses
 *     `zero`/`one`/`two`/`few`/`many`/`other`).
 *
 * Keys are dotted namespaces (`metric.…`, `map.…`) so a component reads its own
 * group together, and all lowercase to keep them easy to grep.
 */

export const en = {
  strings: {
    "app.title": "Think Outside The Box · Campus Waste Intelligence",

    "common.language": "Language",
    "common.signOut": "Sign out",
    "common.primaryNav": "Primary navigation",

    "brand.kicker": "SMART CAMPUS OS",

    "topbar.greeting": "Good morning, {campus}",
    "topbar.export": "Export report",
    "topbar.exportToast": "Report export prepared · {file}",

    "nav.overview": "Overview",
    "nav.campus-map": "Map",
    "nav.hardware": "Hardware",
    "nav.analytics": "Analytics",

    "metric.diversionRate": "DIVERSION RATE",
    "metric.wasteSorted": "WASTE SORTED",
    "metric.pointsDistributed": "POINTS DISTRIBUTED",
    "metric.activeBins": "ACTIVE SMART BINS",
    "metric.criticalBins": "CRITICAL BINS",
    "metric.studentsParticipating": "STUDENTS PARTICIPATING",
    "metric.unit.kg": "kg",
    "metric.note.criticalBins": "vs. last month",
    "metric.note.needsAttention": "vs. last month",
    "metric.note.studentsParticipating": "vs. last month",
    "metric.note.allTime": "vs. last month",
    "metric.note.thisMonth": "this month",
    "metric.note.operational": "operational",
    "metric.goalProgress": "{percent}% of monthly goal",
    "metric.loading": "Loading metrics…",
    "metric.error": "Could not load metrics.",

    "map.eyebrow": "REAL-TIME SENSOR NETWORK",
    "map.title": "Live campus map",
    "map.view.campus": "Campus view",
    "map.view.satellite": "Satellite",
    "map.zoomIn": "Zoom in",
    "map.zoomOut": "Zoom out",
    "map.viewEnabledToast": "{view} enabled",
    "map.zoomedInToast": "Map zoomed in",
    "map.zoomedOutToast": "Map zoomed out",
    "map.legend.tooltip":
      "A marker takes the colour of the most urgent bin at that location",
    "map.legend.healthy": "Healthy",
    "map.legend.attention": "Attention",
    "map.legend.critical": "Critical",
    "map.legend.offline": "Offline",
    "map.legend.updated": "Updated just now",
    "map.legend.live": "Live",
    "map.marker.title": "Bin {number} · {name}",
    "map.popup.high": "HIGH",
    "map.popup.offline": "OFFLINE",
    "map.popup.fullest": "Fullest bin {fill}%",
    "map.notice.missingKey.title": "Campus map needs an API key",
    "map.notice.missingKey.detail":
      "Add VITE_GOOGLE_MAPS_API_KEY to FrontEnd/.env.local and restart the dev server — see FrontEnd/.env.example.",
    "map.notice.error.title": "Campus map unavailable",
    "map.notice.error.detail":
      "Google Maps could not load. Check the API key, the connection, and that Maps JavaScript API is enabled for the key.",
    "map.notice.loading.title": "Loading campus map",
    "map.notice.loading.detail": "Fetching the current bin locations.",
    "map.notice.fetchError.title": "Could not load the bin network",
    "map.notice.fetchError.detail":
      "The live bins API did not respond. Check the connection and that the backend is running.",
    "map.notice.empty.title": "No bins registered yet",
    "map.notice.empty.detail":
      "Add bins to the Bins collection, then reload this map.",
    "map.notice.retry": "Try again",

    "waste.eyebrow": "DIVERSION IMPACT",
    "waste.title": "Waste sorted over time",
    "waste.totalUnit": "kg total",
    "waste.seriesLabel": "Waste sorted (kg)",
    "waste.periodAria": "Waste chart period",
    "waste.empty": "No waste sorted in this period",
    "waste.updatedToast": "Waste chart updated to {period}",
    "waste.period.last30": "Last 30 days",
    "waste.period.last7": "Last 7 days",
    "waste.period.thisYear": "This year",

    "points.eyebrow": "STUDENT ENGAGEMENT",
    "points.title": "Points distributed",
    "points.vsPrevious": "vs. previous period",
    "points.seriesLabel": "Points earned",
    "points.legend": "Points earned from sorting",
    "points.goal": "Goal: {goal}",

    "footer.dashboard": "Think Outside The Box · Campus operations dashboard",
    "footer.edgeNetwork": "Edge AI network",
    "footer.operational": "Operational",

    "auth.kicker": "CAMPUS WASTE INTELLIGENCE",
    "auth.title": "Operator sign in",
    "auth.subtitle":
      "Sign in to reach the live bin network, hardware health, and the student points ledger.",
    "auth.formAria": "Operator sign in",
    "auth.email.label": "Operator email",
    "auth.email.placeholder": "name@campus.edu",
    "auth.password.label": "Password",
    "auth.password.placeholder": "Enter your password",
    "auth.forgot": "Forgot password?",
    "auth.submit": "Sign in",
    "auth.submitting": "Signing in…",
    "auth.security":
      "Access is limited to authorised campus operators. Need an account? Contact your facilities administrator.",
    "auth.footer.publisher": "Think Outside The Box · Campus operations",
    "auth.footer.tagline": "Offline-first bin network",
    "auth.toast.passwordReset": "Password reset isn't available in this build",
    "auth.toast.missingFields": "Please fill in all the fields",
    "auth.toast.invalidCredentials": "Invalid email or password",
    "auth.toast.networkError":
      "Could not reach the server. Check the API and your connection.",
    "auth.toast.loginFailed": "Sign-in failed. Please try again.",
  },
  plurals: {
    "bins.healthy": { one: "{count} healthy", other: "{count} healthy" },
    "bins.attention": { one: "{count} attention", other: "{count} attention" },
  },
};

/** A translatable string key (e.g. `'metric.diversionRate'`). */
export type StringKey = keyof typeof en.strings;

/** A plural key (see `plurals`). */
export type PluralKey = keyof typeof en.plurals;

/** Plural forms: `other` is required, the rest are used where the locale needs them. */
export type PluralForms = { other: string } & Partial<
  Record<"zero" | "one" | "two" | "few" | "many", string>
>;

/** The shape every locale must provide: exactly the English keys. */
export interface Catalog {
  strings: Record<StringKey, string>;
  plurals: Record<PluralKey, PluralForms>;
}
