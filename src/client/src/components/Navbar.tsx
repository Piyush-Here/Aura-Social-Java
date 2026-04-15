import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/">
          Aura
        </Link>

        <nav className="nav-links">
          <Link className={isActive('/') ? 'nav-link active' : 'nav-link'} to="/">
            Feed
          </Link>
          <Link className={isActive('/search') ? 'nav-link active' : 'nav-link'} to="/search">
            Search
          </Link>
          <Link className={isActive('/messages') ? 'nav-link active' : 'nav-link'} to="/messages">
            Messages
          </Link>
        </nav>

        <div className="topbar-actions">
          <Link className="button subtle" to={`/profile/${user?.username}`}>
            {user?.displayName}
          </Link>
          <button className="button ghost" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
