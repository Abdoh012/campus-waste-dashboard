import { pointsByDay } from '../data/mockData.js';

export default function PointsChart({ totalPoints }) {
  return (
    <article className="panel chart-panel points-chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">STUDENT ENGAGEMENT</p>
          <h3>Points distributed</h3>
        </div>
        <button className="more-button" type="button" aria-label="More options">
          •••
        </button>
      </div>

      <div className="points-total">
        <strong>{totalPoints.toLocaleString()}</strong>
        <span className="trend up">↑ 18.4%</span>
        <small>vs. previous period</small>
      </div>

      <div className="bar-chart" aria-label="Points distributed bar chart">
        <div className="bar-grid"></div>
        {pointsByDay.map((bar) => (
          <div key={bar.day} className="bar-item">
            <span className={`bar${bar.active ? ' active' : ''}`} style={{ height: `${bar.height}%` }}></span>
            <small>{bar.day}</small>
          </div>
        ))}
      </div>

      <div className="chart-caption">
        <span>
          <i className="legend-swatch"></i>Points earned from sorting
        </span>
        <span>Goal: 6,000</span>
      </div>
    </article>
  );
}
