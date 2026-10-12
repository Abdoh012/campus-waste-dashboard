export default function MetricGrid({ totalPoints }) {
  return (
    <section className="metric-grid" id="overview" aria-label="Campus performance summary">
      <article className="metric-card metric-green">
        <div className="metric-head">
          <span>DIVERSION RATE</span>
          <span className="metric-icon">↗</span>
        </div>
        <strong className="metric-value">
          78.4<span>%</span>
        </strong>
        <div className="metric-foot">
          <span className="trend up">↑ 6.2%</span>
          <span>vs. last month</span>
        </div>
        <div className="sparkline green-spark">
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index}></i>
          ))}
        </div>
      </article>

      <article className="metric-card metric-orange">
        <div className="metric-head">
          <span>WASTE SORTED</span>
          <span className="metric-icon">◌</span>
        </div>
        <strong className="metric-value">
          1,248<span> kg</span>
        </strong>
        <div className="metric-foot">
          <span className="trend up">↑ 12.8%</span>
          <span>this month</span>
        </div>
        <div className="mini-bars orange-bars">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index}></i>
          ))}
        </div>
      </article>

      <article className="metric-card metric-blue">
        <div className="metric-head">
          <span>POINTS DISTRIBUTED</span>
          <span className="metric-icon">✧</span>
        </div>
        <strong className="metric-value">{totalPoints.toLocaleString()}</strong>
        <div className="metric-foot">
          <span className="trend up">↑ 18.4%</span>
          <span>this month</span>
        </div>
        <div className="progress-track">
          <span style={{ width: '72%' }}></span>
        </div>
        <small className="progress-note">72% of monthly goal</small>
      </article>

      <article className="metric-card metric-purple">
        <div className="metric-head">
          <span>ACTIVE SMART BINS</span>
          <span className="metric-icon">◎</span>
        </div>
        <strong className="metric-value">
          24<span> / 26</span>
        </strong>
        <div className="metric-foot">
          <span className="trend neutral">92.3%</span>
          <span>operational</span>
        </div>
        <div className="bin-status-row">
          <span>
            <i className="dot green"></i>18 healthy
          </span>
          <span>
            <i className="dot yellow"></i>4 attention
          </span>
        </div>
      </article>
    </section>
  );
}
