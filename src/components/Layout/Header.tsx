import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

export function Header() {
  const { theme, toggleTheme } = useTheme();

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

        {/* Nav */}
        <nav className="header__nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            id="nav-investigation"
            className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`}
          >
            🗺 Investigation
          </NavLink>
          <NavLink
            to="/evidence"
            id="nav-evidence"
            className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`}
          >
            🗂 Evidence Records
          </NavLink>
        </nav>

        {/* Status */}
        <div className="header__actions">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className="header__case-badge-wrap">
            <span className="header__case-badge">ACTIVE</span>
          </div>
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
