import { useState } from 'react';
import { campusBins } from '../data/mockData.js';

const MAP_VIEWS = ['Campus view', 'Satellite'];

export default function CampusMap({ showToast }) {
  const [selectedBin, setSelectedBin] = useState(null);
  const [mapView, setMapView] = useState(MAP_VIEWS[0]);

  const handleMapView = (view) => {
    setMapView(view);
    showToast(`${view} enabled`);
  };

  return (
    <article className="panel map-panel" id="campus-map">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">REAL-TIME SENSOR NETWORK</p>
          <h3>Live campus map</h3>
        </div>
        <div className="map-controls">
          {MAP_VIEWS.map((view) => (
            <button
              key={view}
              className={`map-control${mapView === view ? ' active' : ''}`}
              type="button"
              onClick={() => handleMapView(view)}
            >
              {view}
            </button>
          ))}
          <button className="zoom-btn" type="button" aria-label="Zoom out" onClick={() => showToast('Map zoomed out')}>
            −
          </button>
          <button className="zoom-btn" type="button" aria-label="Zoom in" onClick={() => showToast('Map zoomed in')}>
            +
          </button>
        </div>
      </div>

      <div className="map-legend">
        <span>
          <i className="dot green"></i>Healthy <em>&lt;25%</em>
        </span>
        <span>
          <i className="dot yellow"></i>Attention <em>50%</em>
        </span>
        <span>
          <i className="dot red"></i>Critical <em>&gt;75%</em>
        </span>
        <span className="map-updated">
          Updated just now · <span className="live-dot"></span>Live
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
