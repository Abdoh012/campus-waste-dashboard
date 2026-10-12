import { useState } from 'react';
import Eyebrow from './Eyebrow.jsx';
import StatusDot from './StatusDot.jsx';
import { campusBins } from '../data/mockData.js';
import { MAP_VIEWS } from '../data/constants.js';
import { SURFACE } from '../styles/surfaces.js';

const LEGEND_DOT = 'mr-[7px] inline-block h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-live-halo)]';

export default function CampusMap({ showToast }) {
  const [selectedBin, setSelectedBin] = useState(null);
  const [mapView, setMapView] = useState(MAP_VIEWS[0]);

  const handleMapView = (view) => {
    setMapView(view);
    showToast(`${view} enabled`);
  };

  return (
    <article className={`${SURFACE} p-5 max-[700px]:p-[15px]`} id="campus-map">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>REAL-TIME SENSOR NETWORK</Eyebrow>
          <h3 className="font-heading text-[19px] font-semibold tracking-[-0.035em]">Live campus map</h3>
        </div>
        <div className="flex items-center gap-[5px] max-[700px]:gap-1">
          {MAP_VIEWS.map((view) => (
            <button
              key={view}
              className={`cursor-pointer rounded border bg-muted px-[9px] py-[7px] text-[10px] max-[700px]:hidden ${
                mapView === view
                  ? 'border-primary-tint-border bg-primary-tint text-primary-hover'
                  : 'border-border text-label'
              }`}
              type="button"
              onClick={() => handleMapView(view)}
            >
              {view}
            </button>
          ))}
          <button
            className="cursor-pointer rounded border border-border bg-muted px-2 py-[5px] text-base leading-3 text-label-strong"
            type="button"
            aria-label="Zoom out"
            onClick={() => showToast('Map zoomed out')}
          >
            −
          </button>
          <button
            className="cursor-pointer rounded border border-border bg-muted px-2 py-[5px] text-base leading-3 text-label-strong"
            type="button"
            aria-label="Zoom in"
            onClick={() => showToast('Map zoomed in')}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-[19px] mb-3 flex items-center gap-[17px] font-mono text-[10px] text-muted-foreground max-[700px]:flex-wrap max-[700px]:gap-[7px]">
        <span>
          <StatusDot tone="green" />
          Healthy <em className="ml-0.5 not-italic text-label-muted">&lt;25%</em>
        </span>
        <span>
          <StatusDot tone="yellow" />
          Attention <em className="ml-0.5 not-italic text-label-muted">50%</em>
        </span>
        <span>
          <StatusDot tone="red" />
          Critical <em className="ml-0.5 not-italic text-label-muted">&gt;75%</em>
        </span>
        <span className="ml-auto max-[700px]:ml-0 max-[700px]:w-full">
          Updated just now · <span className={LEGEND_DOT}></span>Live
        </span>
      </div>

      <div className="campus-map" role="img" aria-label="Stylized campus map with smart bins">
        <div className="map-road road-a"></div>
        <div className="map-road road-b"></div>
        <div className="map-road road-c"></div>
        <div className="map-lawn lawn-a"></div>
        <div className="map-lawn lawn-b"></div>

        <div className="building building-library">
          <span>LIBRARY</span>
        </div>
        <div className="building building-science">
          <span>
            SCIENCE
            <br />
            HALL
          </span>
        </div>
        <div className="building building-student">
          <span>
            STUDENT
            <br />
            UNION
          </span>
        </div>
        <div className="building building-arts">
          <span>
            ARTS
            <br />
            CENTER
          </span>
        </div>
        <div className="building building-gym">
          <span>
            REC
            <br />
            CENTER
          </span>
        </div>
        <div className="building building-admin">
          <span>ADMIN</span>
        </div>

        <div className="map-label label-quad">THE QUAD</div>
        <div className="map-label label-creek">Willow Creek</div>

        {campusBins.map((bin) => {
          const isSelected = selectedBin?.number === bin.number;
          return (
            <button
              key={bin.number}
              className={`bin-marker bin-${bin.tone} ${bin.markerClass}${isSelected ? ' selected' : ''}`}
              type="button"
              data-bin={`Bin ${bin.number} · ${bin.location}`}
              data-fill={`${bin.fill}%`}
              aria-label={`Bin ${bin.number} ${bin.location}, ${bin.fill} percent full`}
              onClick={() => setSelectedBin(bin)}
            >
              <span>{bin.number}</span>
            </button>
          );
        })}

        <div className={`map-tooltip${selectedBin ? ' show' : ''}`}>
          <strong>{selectedBin ? `Bin ${selectedBin.number} · ${selectedBin.location}` : 'Bin 03 · Student Union'}</strong>
          <span>
            Fill level <b>{selectedBin ? `${selectedBin.fill}%` : '87%'}</b>
          </span>
          <small>Tap any bin to inspect</small>
        </div>
      </div>
    </article>
  );
}
