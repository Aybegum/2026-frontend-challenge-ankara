import { NavLink } from 'react-router-dom';
import './Header.css';

const NAV_LINKS = [
  { to: '/',          label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/sightings', label: 'Sightings', id: 'nav-sightings' },
  { to: '/records',   label: 'All Records', id: 'nav-records' },
];

export function Header() {
  return (
    <header className="header glass" role="banner">
      <div className="header__inner">
        {/* Brand */}
        <div className="header__brand">
          <div className="header__logo">
            <span className="header__logo-icon" aria-hidden="true">🐾</span>
            <div className="header__logo-text">
              <span className="header__title">Missing Podo</span>
              <span className="header__subtitle">The Ankara Case</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="header__nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className={({ isActive }) =>
                `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
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
