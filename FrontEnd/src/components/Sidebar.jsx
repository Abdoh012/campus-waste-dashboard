import { navItems } from '../data/mockData.js';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <p className="eyebrow">SMART CAMPUS OS</p>
          <h1>
            Think Outside
            <br />
            The Box
          </h1>
        </div>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        {navItems.map((item, index) => (
          <a key={item.id} className={`nav-item${index === 0 ? ' active' : ''}`} href={item.href}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sync-orb">
          <span></span>
          <div>
            <strong>Network online</strong>
            <small>Last sync · 32 sec ago</small>
          </div>
        </div>
        <button className="profile-chip" type="button">
          <span className="avatar">AM</span>
          <span>
            <strong>Admin</strong>
            <small>Campus ops</small>
          </span>
          <span className="chevron">⌄</span>
        </button>
      </div>
    </aside>
  );
}
