import React from 'react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onCreatePost: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onCreatePost }) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="logo serif">Aura</div>
        
        <div className="nav-links">
          <button className="nav-btn">Home</button>
          <button className="nav-btn">Search</button>
          <button onClick={onCreatePost} className="nav-btn">Post</button>
          <button className="nav-btn">Activity</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '8px' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} className="avatar" alt="Profile" />
            ) : (
              <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', background: '#eee' }}>
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <button onClick={onLogout} className="nav-btn" style={{ fontSize: '12px' }}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};
