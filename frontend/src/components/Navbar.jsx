import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Navbar = ({ publicMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login', { state: { message: 'Logged out successfully' } });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="navbar navbar-expand-lg sticky-top glass-card futuristic-navbar mx-3 mt-3 px-4 py-3"
      style={{ borderBottom: 'none' }}
    >
      {/* Premium shine confined to prevent dropdown clipping */}
      <div className="navbar-shine-wrapper"></div>

      <div className="container-fluid" style={{ overflow: 'visible' }}>
        <Link className="navbar-brand d-flex align-items-center" to={publicMode ? "/" : "/dashboard"}>
          <i className="bi bi-hexagon-fill text-gradient me-2" style={{ fontSize: '1.5rem' }}></i>
          <span className="fw-bold fs-4" style={{ color: 'white' }}>Campus<span className="text-gradient">Pulse</span></span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            {publicMode ? (
              <>
                <li className="nav-item mx-1 my-2 my-lg-0">
                  <Link 
                    className="public-glass-btn" 
                    style={isActive('/') ? {
                      background: 'rgba(255, 255, 255, 0.12)',
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 0 15px rgba(255, 255, 255, 0.35), 0 0 25px rgba(255, 255, 255, 0.15)',
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                    } : {}} 
                    to="/"
                  >
                    Home
                  </Link>
                </li>
                <li className="nav-item mx-1 my-2 my-lg-0">
                  <a className="public-glass-btn" href="#features">Features</a>
                </li>
                <li className="nav-item mx-1 my-2 my-lg-0">
                  <Link to="/login" className="public-glass-btn">Login</Link>
                </li>
                <li className="nav-item mx-1 my-2 my-lg-0">
                  <Link to="/register" className="public-glass-btn" style={{ background: 'rgba(255, 255, 255, 0.08) !important', borderColor: 'rgba(255, 255, 255, 0.35) !important' }}>Get Started</Link>
                </li>
              </>
            ) : (
              <>
                <div className="nav-glass-container d-flex me-lg-3 my-2 my-lg-0">
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/') ? ' active' : ''}`}
                      style={isActive('/') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/"
                    >
                      Home
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/dashboard') ? ' active' : ''}`}
                      style={isActive('/dashboard') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/dashboard"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/events') ? ' active' : ''}`}
                      style={isActive('/events') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/events"
                    >
                      Events
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/clubs') ? ' active' : ''}`}
                      style={isActive('/clubs') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/clubs"
                    >
                      Clubs
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/chat') ? ' active' : ''}`}
                      style={isActive('/chat') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/chat"
                    >
                      Chat
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link glow-nav-link text-light${isActive('/profile') ? ' active' : ''}`}
                      style={isActive('/profile') ? {
                        color: '#fef08a',
                        background: 'rgba(253, 224, 71, 0.12)',
                        textShadow: '0 0 8px rgba(253, 224, 71, 0.8)',
                        border: '1px solid rgba(253, 224, 71, 0.35)'
                      } : {}}
                      to="/profile"
                    >
                      Profile
                    </Link>
                  </li>
                </div>
                {user?.role === 'ROLE_ADMIN' && (
                  <li className="nav-item">
                    <Link className="nav-link glow-nav-link text-light text-gradient" to="/admin">Admin Panel</Link>
                  </li>
                )}

                {/* React-controlled dropdown — no Bootstrap JS dependency */}
                <li className="nav-item dropdown ms-lg-2 mt-2 mt-lg-0" ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    className="nav-link glow-dropdown-toggle d-flex align-items-center border-0"
                    style={{ background: 'none', cursor: 'pointer' }}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                  >
                    <img
                      src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=6C63FF&color=fff`}
                      alt="Profile"
                      className="rounded-circle me-2"
                      style={{ width: '35px', height: '35px', border: '2px solid var(--primary-neon)', transition: 'all 0.3s ease' }}
                    />
                    <span className="text-light">{user?.name || 'User'}</span>
                    <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-2 text-light`} style={{ fontSize: '0.75rem', transition: 'transform 0.25s ease' }}></i>
                  </button>

                  {/* Dropdown panel */}
                  <ul
                    className={`dropdown-menu dropdown-menu-end${dropdownOpen ? ' show' : ''}`}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      left: 'auto',
                    }}
                  >
                    <li>
                      <Link
                        className="dropdown-item text-light py-2"
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-speedometer2 me-3 text-gradient"></i>Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item text-light py-2"
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-person me-3 text-gradient"></i>My Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item text-light py-2"
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-gear me-3 text-gradient"></i>Settings
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider opacity-25 my-1" /></li>
                    <li>
                      <button
                        className="dropdown-item text-danger py-2 fw-bold"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-3"></i>Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
