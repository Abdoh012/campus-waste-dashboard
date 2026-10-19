import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { SURFACE } from "../../../styles/surfaces";
import { useI18n } from "../../../shared/i18n/useI18n";
import type { StringKey } from "../../../shared/i18n/locales/en";
import type { ApiError } from "../../../services/apiClient";
import { MAP_ZOOM, POPUP_PLACEMENT } from "../campusMapData";
import type { BinLocation, StationConnectivity } from "../campusMapData";
import { resolveStationView } from "../stationView";
import BinMarker from "./BinMarker";
import LocationPopup from "./LocationPopup";
import MapNotice from "./MapNotice";

/** Inlined at build time; the map shows a setup notice when this is empty. */
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

/**
 * Advanced markers need a map ID. `DEMO_MAP_ID` is Google's documented
 * development id; set `VITE_GOOGLE_MAPS_MAP_ID` for a styled production map.
 */
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface ActiveLocation {
  id: string;
  /**
   * Tapped/clicked locations stay open until another location or the map is
   * selected — a tap is followed by synthetic mouse events, so closing on
   * "mouse leave" would undo the tap instantly; hovered ones close as soon as
   * the pointer leaves the marker.
   */
  pinned: boolean;
}

export interface BinsMapProps {
  mapTypeId: "roadmap" | "hybrid";
  zoom: number;
  onZoomChange: (zoom: number) => void;
  active: ActiveLocation | null;
  onActiveChange: (active: ActiveLocation | null) => void;
  /** Live stations from `GET /api/stations`, one marker location each. */
  stations: readonly BinLocation[];
  /** Stations returned by the API, including ones without valid coordinates. */
  stationsTotal: number;
  /** Stations skipped because they have no usable coordinates. */
  stationsSkipped: number;
  center: { lat: number; lng: number };
  stationsLoading: boolean;
  stationsError: ApiError | null;
  onRetry: () => void;
}

/**
 * Hands the map instance up to `BinsMap`. `useMap` only resolves inside
 * `<Map>`, whereas the popup has to sit *outside* it — positioned against the
 * panel rather than inside Google's own overlay container, whose clamping is
 * what cut the popup off.
 */
function MapInstance({ onMap }: { onMap: (map: google.maps.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) onMap(map);
  }, [map, onMap]);

  return null;
}

const RETRY_BUTTON =
  "cursor-pointer rounded border border-border bg-card px-3 py-1.5 text-2xs font-medium text-foreground transition-colors duration-200 hover:bg-muted";

const CONNECTIVITY_KEYS: Record<StationConnectivity, StringKey> = {
  online: "map.connectivity.online",
  partial: "map.connectivity.partial",
  offline: "map.connectivity.offline",
};

/**
 * The live Google map: exactly one numbered, colour-coded marker per station,
 * with a popup listing that station's containers on hover (desktop) or tap
 * (touch). Marker colour is the station's highest known fill severity, not its
 * connectivity. Loading, empty, incomplete-coordinate, failed-request,
 * missing-key and Maps-failure states replace or annotate the map rather than
 * leaving a broken one behind.
 */
export default function BinsMap({
  mapTypeId,
  zoom,
  onZoomChange,
  active,
  onActiveChange,
  stations,
  stationsTotal,
  stationsSkipped,
  center,
  stationsLoading,
  stationsError,
  onRetry,
}: BinsMapProps) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  /** Location the map has already been nudged for, so it only ever nudges once. */
  const nudgedFor = useRef<string | null>(null);
  /** Whether the camera has already been framed on the first batch of bins. */
  const framedOnce = useRef(false);

  const activeLocation = active
    ? (stations.find((station) => station.id === active.id) ?? null)
    : null;

  /**
   * Resolved once per render. Crucially, a loaded snapshot wins over a failed
   * refresh: the map stays mounted so markers and the camera are preserved,
   * and the failure becomes a non-blocking warning (see `stationView.ts`).
   */
  const view = resolveStationView({
    loading: stationsLoading,
    hasError: stationsError !== null,
    stationCount: stations.length,
    total: stationsTotal,
    skipped: stationsSkipped,
  });

  /**
   * Places the popup beside its marker, and keeps it there as the camera moves:
   * preferred above the marker, flipped below it when there is no room above,
   * then clamped inside the panel. Google's own InfoWindow could only guarantee
   * this by panning the map, which is why a marker near the top edge used to
   * open a popup that the panel's clipped corners swallowed.
   */
  useLayoutEffect(() => {
    if (!active?.pinned) nudgedFor.current = null;

    const frame = frameRef.current;
    const popup = popupRef.current;

    if (!map || !frame || !popup || !active || !activeLocation) return;

    const anchor = activeLocation.position;

    const place = () => {
      const projection = map.getProjection();
      const bounds = map.getBounds();
      const zoomLevel = map.getZoom();
      if (!projection || !bounds || zoomLevel === undefined) return;

      // Where the marker sits inside the panel. The projection measures in
      // world units, so the offset from the viewport's north-west corner is
      // scaled by the zoom — Google's documented conversion, valid for the
      // unrotated, untilted views this map offers.
      const worldNorthWest = projection.fromLatLngToPoint({
        lat: bounds.getNorthEast().lat(),
        lng: bounds.getSouthWest().lng(),
      });
      const worldAnchor = projection.fromLatLngToPoint(anchor);
      if (!worldNorthWest || !worldAnchor) return;

      const scale = 2 ** zoomLevel;
      const anchorX = (worldAnchor.x - worldNorthWest.x) * scale;
      const anchorY = (worldAnchor.y - worldNorthWest.y) * scale;

      const { markerRadius, gap, edge } = POPUP_PLACEMENT;
      const popupHeight = popup.offsetHeight;
      const popupWidth = popup.offsetWidth;
      const above = anchorY - markerRadius - gap - popupHeight;
      const below = anchorY + markerRadius + gap;

      // A clicked location nudges the map once, just far enough for the popup
      // to clear its marker; hovering never moves the map under the pointer.
      // `panBy` moves the map's centre, so the offset is negated to push the
      // marker down and open the room the popup needs.
      const clearance = edge - above;
      if (active.pinned && clearance > 0 && nudgedFor.current !== active.id) {
        nudgedFor.current = active.id;
        map.panBy(0, -clearance);
      }

      const top = clamp(
        above >= edge ? above : below,
        edge,
        Math.max(edge, frame.clientHeight - popupHeight - edge),
      );
      const left = clamp(
        anchorX - popupWidth / 2,
        edge,
        Math.max(edge, frame.clientWidth - popupWidth - edge),
      );

      popup.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    };

    place();
    const listener = map.addListener("bounds_changed", place);
    return () => listener.remove();
  }, [map, active, activeLocation]);

  // Frame the live stations from `GET /api/stations` *once*, the first time
  // both the map instance and the data are ready. The map opens on `center`
  // (BATU); a later refresh or poll must never move the camera out from under
  // the user. A single station keeps the designed zoom instead of Google's
  // maximum.
  useEffect(() => {
    if (!map || framedOnce.current || stations.length === 0) return;
    framedOnce.current = true;

    if (stations.length === 1) {
      map.setCenter(stations[0].position);
      map.setZoom(MAP_ZOOM.initial);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const station of stations) bounds.extend(station.position);
    map.fitBounds(bounds, 48);
  }, [map, stations]);

  if (!API_KEY) {
    return (
      <MapNotice
        tone="config"
        title={t("map.notice.missingKey.title")}
        detail={t("map.notice.missingKey.detail")}
      />
    );
  }

  if (failed) {
    return (
      <MapNotice
        tone="error"
        title={t("map.notice.error.title")}
        detail={t("map.notice.error.detail")}
      />
    );
  }

  if (view.kind === "loading") {
    return (
      <MapNotice
        tone="loading"
        title={t("map.notice.loading.title")}
        detail={t("map.notice.loading.detail")}
      />
    );
  }

  if (view.kind === "blockingError") {
    return (
      <MapNotice
        tone="error"
        title={t("map.notice.fetchError.title")}
        detail={t("map.notice.fetchError.detail")}
        action={
          <button type="button" className={RETRY_BUTTON} onClick={onRetry}>
            {t("map.notice.retry")}
          </button>
        }
      />
    );
  }

  if (view.kind === "empty") {
    return (
      <MapNotice
        tone={view.noCoordinates ? "error" : "empty"}
        title={t(
          view.noCoordinates
            ? "map.notice.noCoordinates.title"
            : "map.notice.empty.title",
        )}
        detail={t(
          view.noCoordinates
            ? "map.notice.noCoordinates.detail"
            : "map.notice.empty.detail",
        )}
        action={
          <button type="button" className={RETRY_BUTTON} onClick={onRetry}>
            {t("map.notice.retry")}
          </button>
        }
      />
    );
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      language="en"
      region="EG"
      onError={() => setFailed(true)}
    >
      <div className="relative h-full w-full" ref={frameRef}>
        <Map
          className="h-full w-full"
          mapId={MAP_ID}
          mapTypeId={mapTypeId}
          defaultCenter={center}
          zoom={zoom}
          onCameraChanged={(event) => onZoomChange(event.detail.zoom)}
          onIdle={() => setLoaded(true)}
          gestureHandling="cooperative"
          disableDefaultUI
          clickableIcons={false}
          onClick={() => onActiveChange(null)}
        >
          <MapInstance onMap={setMap} />

          {stations.map((station) => (
            <AdvancedMarker
              key={station.id}
              position={station.position}
              clickable
              anchorLeft="-50%"
              anchorTop="-50%"
              onMouseEnter={() =>
                onActiveChange({ id: station.id, pinned: false })
              }
              onMouseLeave={() =>
                onActiveChange(active?.pinned ? active : null)
              }
              onClick={() => onActiveChange({ id: station.id, pinned: true })}
            >
              <BinMarker
                location={station}
                active={active?.id === station.id}
                title={`${t("map.marker.title", {
                  number: station.number,
                  name: station.name,
                })} · ${t(CONNECTIVITY_KEYS[station.connectivity])}`}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {activeLocation && (
          <div
            className={`pointer-events-none absolute top-0 left-0 z-20 ${SURFACE} p-3`}
            ref={popupRef}
          >
            <LocationPopup location={activeLocation} />
          </div>
        )}

        {view.refreshFailed && (
          <div
            className={`absolute top-2 start-2 z-10 flex items-center gap-2 ${SURFACE} px-2 py-1 font-mono text-2xs text-label`}
            role="status"
          >
            <span>{t("map.notice.refreshFailed")}</span>
            <button type="button" className={RETRY_BUTTON} onClick={onRetry}>
              {t("map.notice.retry")}
            </button>
          </div>
        )}

        {stationsSkipped > 0 && stations.length > 0 && (
          <div
            className={`pointer-events-none absolute bottom-2 start-2 z-10 ${SURFACE} px-2 py-1 font-mono text-2xs text-label`}
          >
            {t("map.notice.skipped", { count: stationsSkipped })}
          </div>
        )}

        {!loaded && (
          <MapNotice
            tone="loading"
            title={t("map.notice.loading.title")}
            detail={t("map.notice.loading.detail")}
            className="absolute inset-0"
          />
        )}
      </div>
    </APIProvider>
  );
}
