import './Header.css';

export function Header() {
  return (
    <header className="header glass" role="banner">
      <div className="header__inner">

        {/* Brand */}
        <div className="header__brand">
          <span className="header__logo-icon" aria-hidden="true">🐾</span>
          <div className="header__logo-text">
            <span className="header__title">Missing Podo</span>
            <span className="header__subtitle">The Ankara Case</span>
          </div>
        </div>

        {/* Center label */}
        <div className="header__case-label">
          <span className="header__case-badge">ACTIVE INVESTIGATION</span>
          <span className="header__case-tagline">Track subjects · Find Podo · Identify suspects</span>
        </div>

        {/* Status */}
        <div className="header__actions">
          <div className="header__status" aria-label="Live data connection active">
            <span className="status-dot status-dot--online pulse-ring" />
            <span className="text-sm text-secondary">Live Feed</span>
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
