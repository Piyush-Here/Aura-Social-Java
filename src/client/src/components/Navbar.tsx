import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navStyle = (path: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: isActive(path) ? 600 : 400,
    color: isActive(path) ? '#000' : '#666',
    padding: '4px 0',
    textDecoration: 'none',
    borderBottom: isActive(path) ? '1.5px solid #000' : '1.5px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '0.5px solid #ececec',
      height: 64,
    }}>
      <div style={{
        maxWidth: 960, margin: '0 auto', height: '100%',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 24px',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 20, fontWeight: 700,
          color: '#000', textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}>
          Aura
        </Link>

        {/* Center nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link to="/" style={navStyle('/')}>Home</Link>
          <Link to="/search" style={navStyle('/search')}>Search</Link>
          <Link to="/messages" style={navStyle('/messages')}>Messages</Link>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/?create=1')}
            style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: 6, padding: '7px 14px', fontSize: 12,
              fontWeight: 500, cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >
            + Post
          </button>

          <Link to={`/profile/${user?.id}`} style={{ textDecoration: 'none' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#111', color: '#fff',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>

          <button
            onClick={logout}
            style={{
              background: 'none', border: '0.5px solid #ddd',
              borderRadius: 6, padding: '6px 12px', fontSize: 12,
              color: '#666', cursor: 'pointer',
            }}
          >
            Out
          </button>
        </div>
      </div>
    </nav>
  );
};
