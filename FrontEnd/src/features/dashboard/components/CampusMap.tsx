import { useState } from "react";
import Eyebrow from "../../../shared/ui/Eyebrow";
import StatusDot from "../../../shared/ui/StatusDot";
import { showInfo, showSuccess } from "../../../shared/ui/notifications";
import { SURFACE } from "../../../styles/surfaces";
import { FILL_THRESHOLDS, MAP_TYPE_BY_VIEW, MAP_ZOOM } from "../campusMapData";
import { MAP_VIEWS } from "../options";
import type { MapView } from "../options";
import BinsMap from "./BinsMap";
import type { ActiveLocation } from "./BinsMap";

const LEGEND_DOT =
  "mr-2 inline-block h-1.5 w-1.5 rounded-full bg-live ring-3 ring-live-halo";

const clampZoom = (zoom: number) =>
  Math.min(MAP_ZOOM.max, Math.max(MAP_ZOOM.min, zoom));

export default function CampusMap() {
  const [mapView, setMapView] = useState<MapView>(MAP_VIEWS[0]);
  const [zoom, setZoom] = useState<number>(MAP_ZOOM.initial);
  const [active, setActive] = useState<ActiveLocation | null>(null);

  const handleMapView = (view: MapView) => {
    setMapView(view);
    showSuccess(`${view} enabled`);
  };

  const stepZoom = (delta: number) => {
    setZoom((current) => clampZoom(current + delta));
    showInfo(delta > 0 ? "Map zoomed in" : "Map zoomed out");
  };

  return (
    <article className={`${SURFACE} p-5 max-sm:p-4`} id="campus-map">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>REAL-TIME SENSOR NETWORK</Eyebrow>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            Live campus map
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {MAP_VIEWS.map((view) => (
            <button
              key={view}
              className={`cursor-pointer rounded border bg-muted px-2 py-2 text-2xs max-sm:hidden ${
                mapView === view
                  ? "border-primary-tint-border bg-primary-tint text-primary-hover"
                  : "border-border text-label"
              }`}
              type="button"
              onClick={() => handleMapView(view)}
            >
              {view}
            </button>
          ))}
          <button
            className="cursor-pointer rounded border border-border bg-muted px-2 py-1 text-base leading-3 text-label-strong"
            type="button"
            aria-label="Zoom out"
            onClick={() => stepZoom(-1)}
          >
            −
          </button>
          <button
            className="cursor-pointer rounded border border-border bg-muted px-2 py-1 text-base leading-3 text-label-strong"
            type="button"
            aria-label="Zoom in"
            onClick={() => stepZoom(1)}
          >
            +
          </button>
        </div>
      </div>

      <div
        className="mt-5 mb-3 flex items-center gap-4 font-mono text-2xs text-muted-foreground max-sm:flex-wrap max-sm:gap-2"
        title="A marker takes the colour of the fullest of the three bins at that location"
      >
        <span>
          <StatusDot tone="green" />
          Healthy{" "}
          <em className="ml-0.5 not-italic text-label-muted">
            &lt;{FILL_THRESHOLDS.attention}%
          </em>
        </span>

        <span>
          <StatusDot tone="yellow" />
          Attention{" "}
          <em className="ml-0.5 not-italic text-label-muted">
            {FILL_THRESHOLDS.attention}–{FILL_THRESHOLDS.critical - 1}%
          </em>
        </span>
        <span>
          <StatusDot tone="red" />
          Critical{" "}
          <em className="ml-0.5 not-italic text-label-muted">
            ≥{FILL_THRESHOLDS.critical}%
          </em>
        </span>
        <span className="ml-auto max-sm:ml-0 max-sm:w-full">
          Updated just now · <span className={LEGEND_DOT}></span>Live
        </span>
      </div>

      <div className="h-90 overflow-hidden rounded-md border border-border bg-muted max-sm:h-75">
        <BinsMap
          mapTypeId={MAP_TYPE_BY_VIEW[mapView]}
          zoom={zoom}
          onZoomChange={setZoom}
          active={active}
          onActiveChange={setActive}
        />
      </div>
    </article>
  );
}
