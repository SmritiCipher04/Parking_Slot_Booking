import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const Navbar = () => {
  const { user, admin, logout, adminLogout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleAdminLogout = () => {
    adminLogout();
    setIsMenuOpen(false);
    navigate('/admin-login');
  };

  return (
    <header>
      {/* Primary Top Navigation Bar */}
      <nav className="navbar">
        <div className="nav-left" ref={dropdownRef}>
          <button 
            type="button" 
            className="hamburger-btn" 
            id="hamburger-btn" 
            aria-label="Toggle navigation menu"
            title="Menu"
            onClick={toggleDropdown}
          >
            ☰
          </button>

          <div className={`dropdown-menu ${isMenuOpen ? 'show' : ''}`} id="dropdown-menu">
            {user ? (
              <>
                <div className="dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserAvatar user={user} size={36} />
                  <div>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  👤 User Profile
                </Link>
                <Link to="/history" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  📋 My Bookings
                </Link>
                <Link to="/my-subscriptions" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  🎫 My ExcuseME PLUS Passes
                </Link>
                <Link to="/excuseme-plus" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  💳 Get ExcuseME PLUS Pass
                </Link>
                <Link to="/transactions" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  💳 Transaction History
                </Link>
                <div className="dropdown-divider"></div>
                <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </>
            ) : admin ? (
              <>
                <div className="dropdown-header">
                  <div className="user-name">Admin: {admin.username}</div>
                  <div className="user-email">System Control Panel</div>
                </div>
                <Link to="/admin-dashboard" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  📊 Control Dashboard
                </Link>
                <Link to="/" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  🚗 User Portal Home
                </Link>
                <div className="dropdown-divider"></div>
                <button type="button" className="dropdown-item text-danger" onClick={handleAdminLogout}>
                  🚪 Admin Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/excuseme-plus" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  💳 ExcuseME PLUS Passes
                </Link>
                <Link to="/login" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  🔑 User Login
                </Link>
                <Link to="/register" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  📝 Register Account
                </Link>
                <div className="dropdown-divider"></div>
                <Link to="/admin-login" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  🛡️ Admin Portal Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="nav-center">
          <Link to={user ? "/" : "/login"} className="brand-logo">
            <h1>ExcuseME</h1>
          </Link>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
              <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
                My Bookings
              </Link>
              <Link to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
                Transactions
              </Link>
              <Link to="/profile" className="user-badge" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px 4px 6px', borderRadius: '20px' }}>
                <UserAvatar user={user} size={26} />
                <span>{user.name ? user.name.split(' ')[0] : 'Profile'}</span>
              </Link>
            </>
          ) : admin ? (
            <>
              <Link to="/admin-dashboard" className={`nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <button type="button" onClick={handleAdminLogout} className="btn btn-sm btn-secondary">
                Admin Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Dedicated ExcuseME PLUS Secondary Sub-Navbar Bar */}
      <div className="plus-subnavbar">
        <div className="plus-subnavbar-container">
          <div className="plus-subnavbar-brand">
            <span className="plus-badge">PLUS</span>
            <span>ExcuseME PLUS Subscriptions — Unlimited Parking & Zero Daily Fees</span>
          </div>

          <div className="plus-subnavbar-links">
            <Link to="/excuseme-plus" className="plus-subnav-btn">
              Get Subscription Pass
            </Link>

            {user && (
              <Link to="/my-subscriptions" className="plus-subnav-btn" style={{ backgroundColor: '#f1f5f9', color: '#1e293b', borderColor: '#cbd5e1' }}>
                My Active Passes
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
