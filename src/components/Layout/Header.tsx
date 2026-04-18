import './Header.css';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="header glass" role="banner">
      <div className="header__inner">
        {/* Left — logo + case title */}
        <div className="header__brand">
          <button
            className="header__menu-btn btn btn--ghost"
            aria-label="Toggle navigation"
            onClick={onMenuToggle}
            id="header-menu-toggle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="header__logo">
            <span className="header__logo-icon" aria-hidden="true">🐾</span>
            <div className="header__logo-text">
              <span className="header__title">Missing Podo</span>
              <span className="header__subtitle">The Ankara Case</span>
            </div>
          </div>
        </div>

        {/* Right — status indicator */}
        <div className="header__actions">
          <div className="header__status" aria-label="Live data connection active">
            <span className="status-dot status-dot--online pulse-ring" />
            <span className="text-sm text-secondary">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
