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
    "common.theme": "Theme",
    "common.signOut": "Sign out",
    "common.primaryNav": "Primary navigation",

    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    "brand.kicker": "SMART CAMPUS OS",

    "topbar.greeting": "Good morning, {campus}",
    "topbar.export": "Export report",
    "topbar.exportToast": "Report downloaded · {file}",
    "topbar.exportError": "Could not export the report. Please try again.",

    "nav.overview": "Overview",
    "nav.campus-map": "Map",
    "nav.hardware": "Hardware",
    "nav.analytics": "Analytics",

    "metric.diversionRate": "DIVERSION RATE",
    "metric.wasteSorted": "WASTE SORTED",
    "metric.pointsDistributed": "POINTS DISTRIBUTED",
    "metric.activeBins": "CONNECTED STATIONS",
    "metric.criticalBins": "CRITICAL STATIONS",
    "metric.studentsParticipating": "STUDENTS WITH POINTS",
    "metric.unit.kg": "kg",
    "metric.note.criticalBins": "highest known fill",
    "metric.note.needsAttention": "highest known fill",
    "metric.note.studentsParticipating": "students in the points ledger",
    "metric.note.allTime": "all-time total",
    "metric.note.thisMonth": "all-time total",
    "metric.note.operational": "fully connected stations",
    "metric.note.stationConnectivity":
      "{online} fully connected · {partial} partial · {offline} offline stations",
    "metric.note.containerFill":
      "Containers: {healthy} healthy · {attention} attention · {critical} critical · {unknown} no reading",
    "metric.note.containerConnectivity":
      "{online}/{total} containers online · {offline} offline · {never} no reading",
    "metric.note.studentsWithPoints": "students in the points ledger",
    "metric.goalProgress": "{percent}% of monthly goal",
    "metric.loading": "Loading metrics…",
    "metric.error": "Could not load metrics.",
    "metric.alert.unassigned":
      "{count} container(s) are not assigned to any station, so they are not shown on the map.",
    "metric.alert.orphaned":
      "{count} container(s) point at a station that no longer exists.",

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
      "Marker colour is the station's highest known fill severity; connectivity is shown on the marker and in the popup",
    "map.legend.healthy": "Healthy",
    "map.legend.attention": "Attention",
    "map.legend.critical": "Critical",
    "map.legend.offline": "Offline",
    "map.legend.noReading": "No reading",
    "map.legend.updated": "Auto-refresh",
    "map.legend.live": "every 30s",
    "map.marker.title": "Station {number} · {name}",
    "map.connectivity.online": "Online",
    "map.connectivity.partial": "Partially connected",
    "map.connectivity.offline": "Offline",
    "map.connectivity.never-connected": "Never connected",
    "map.severity.healthy": "Healthy",
    "map.severity.attention": "Attention",
    "map.severity.critical": "Critical",
    "map.severity.unknown": "No reading",
    "map.wasteType.paper": "Paper",
    "map.wasteType.plastic": "Plastic",
    "map.wasteType.liquids": "Liquids",
    "map.popup.unclassified": "Unclassified",
    "map.popup.noReading": "No reading",
    "map.popup.lastKnown": "Last known {fill} · {time}",
    "map.popup.current": "Updated {time}",
    "map.popup.neverConnected": "Never connected · no reading",
    "map.popup.offlineNoReading": "Offline · no reading",
    "map.popup.stationSeverity": "Station severity: {severity}",
    "map.popup.incomplete":
      "Incomplete station: {actual} of {expected} containers",
    "map.popup.high": "HIGH",
    "map.popup.offline": "OFFLINE",
    "map.popup.fullest": "Fullest container {fill}%",
    "map.notice.missingKey.title": "Campus map needs an API key",
    "map.notice.missingKey.detail":
      "Add VITE_GOOGLE_MAPS_API_KEY to FrontEnd/.env.local and restart the dev server — see FrontEnd/.env.example.",
    "map.notice.error.title": "Campus map unavailable",
    "map.notice.error.detail":
      "Google Maps could not load. Check the API key, the connection, and that Maps JavaScript API is enabled for the key.",
    "map.notice.loading.title": "Loading campus map",
    "map.notice.loading.detail":
      "Fetching the current station and container states.",
    "map.notice.fetchError.title": "Could not load the station network",
    "map.notice.fetchError.detail":
      "The live stations API did not respond. Check the connection and that the backend is running.",
    "map.notice.empty.title": "No stations configured yet",
    "map.notice.empty.detail":
      "Create station records and associate three containers with each, then reload this map.",
    "map.notice.noCoordinates.title": "Stations have no coordinates",
    "map.notice.noCoordinates.detail":
      "Every returned station is missing a valid map location. Add coordinates to the station records.",
    "map.notice.skipped": "{count} station(s) without coordinates not shown",
    "map.notice.retry": "Try again",
    "map.notice.refreshFailed": "Refresh failed — showing the last loaded stations",

    "waste.eyebrow": "FILL TREND",
    "waste.title": "Average fill level over time",
    "waste.averageUnit": "% (average)",
    "waste.seriesLabel": "Average fill level (%)",
    "waste.periodAria": "Fill-level chart period",
    "waste.empty": "No fill-level readings in this period",
    "waste.loading": "Loading fill-level history…",
    "waste.error": "Could not load fill-level history.",
    "waste.updatedToast": "Fill chart updated to {period}",
    "waste.period.last30": "Last 30 days",
    "waste.period.last7": "Last 7 days",
    "waste.period.thisYear": "This year",

    "points.eyebrow": "STUDENT ENGAGEMENT",
    "points.title": "Points distributed",
    "points.allTime": "all-time total",
    "points.seriesLabel": "Points earned",
    "points.legend": "Points earned from sorting",
    "points.loading": "Loading daily points…",
    "points.error": "Could not load daily points.",
    "points.empty": "No points awarded in this period",

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
    "bins.healthy": {
      one: "{count} healthy container",
      other: "{count} healthy containers",
    },
    "bins.attention": {
      one: "{count} attention container",
      other: "{count} attention containers",
    },
    "stations.healthy": {
      one: "{count} healthy station",
      other: "{count} healthy stations",
    },
    "stations.attention": {
      one: "{count} attention station",
      other: "{count} attention stations",
    },
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
