import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { SURFACE } from '../../../styles/surfaces';
import { CAMPUS_CENTER, POPUP_PLACEMENT, binLocations } from '../campusMapData';
import BinMarker from './BinMarker';
import LocationPopup from './LocationPopup';
import MapNotice from './MapNotice';

/** Inlined at build time; the map shows a setup notice when this is empty. */
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/**
 * Advanced markers need a map ID. `DEMO_MAP_ID` is Google's documented
 * development id; set `VITE_GOOGLE_MAPS_MAP_ID` for a styled production map.
 */
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

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
  mapTypeId: 'roadmap' | 'hybrid';
  zoom: number;
  onZoomChange: (zoom: number) => void;
  active: ActiveLocation | null;
  onActiveChange: (active: ActiveLocation | null) => void;
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

/**
 * The live Google map: one numbered, colour-coded marker per bin location, with
 * the three-bin popup opening on hover (desktop) or tap (touch). Loading,
 * missing-key and load-failure states replace the map rather than leaving a
 * broken one behind.
 */
export default function BinsMap({
  mapTypeId,
  zoom,
  onZoomChange,
  active,
  onActiveChange,
}: BinsMapProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  /** Location the map has already been nudged for, so it only ever nudges once. */
  const nudgedFor = useRef<string | null>(null);

  const activeLocation = active
    ? binLocations.find((location) => location.id === active.id) ?? null
    : null;

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
    const listener = map.addListener('bounds_changed', place);
    return () => listener.remove();
  }, [map, active, activeLocation]);

  if (!API_KEY) {
    return (
      <MapNotice
        tone="config"
        title="Campus map needs an API key"
        detail="Add VITE_GOOGLE_MAPS_API_KEY to FrontEnd/.env.local and restart the dev server — see FrontEnd/.env.example."
      />
    );
  }

  if (failed) {
    return (
      <MapNotice
        tone="error"
        title="Campus map unavailable"
        detail="Google Maps could not load. Check the API key, the connection, and that Maps JavaScript API is enabled for the key."
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
          defaultCenter={CAMPUS_CENTER}
          zoom={zoom}
          onCameraChanged={(event) => onZoomChange(event.detail.zoom)}
          onIdle={() => setLoaded(true)}
          gestureHandling="cooperative"
          disableDefaultUI
          clickableIcons={false}
          onClick={() => onActiveChange(null)}
        >
          <MapInstance onMap={setMap} />

          {binLocations.map((location) => (
            <AdvancedMarker
              key={location.id}
              position={location.position}
              title={`Bin ${location.number} · ${location.name}`}
              clickable
              anchorLeft="-50%"
              anchorTop="-50%"
              onMouseEnter={() =>
                onActiveChange({ id: location.id, pinned: false })
              }
              onMouseLeave={() => onActiveChange(active?.pinned ? active : null)}
              onClick={() => onActiveChange({ id: location.id, pinned: true })}
            >
              <BinMarker location={location} active={active?.id === location.id} />
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

        {!loaded && (
          <MapNotice
            tone="loading"
            title="Loading campus map"
            detail="Fetching the current bin locations."
            className="absolute inset-0"
          />
        )}
      </div>
    </APIProvider>
  );
}
