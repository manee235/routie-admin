import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Bus,
  MapPin,
  Route,
  Ticket,
  MessageSquare,
  Users,
  Bell,
  Settings,
  Moon,
  Sun,
  LogOut,
  User
} from 'lucide-react';

const DashboardLayout = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutGrid size={18} />, label: 'Overview' },
    { path: '/buses', icon: <Bus size={18} />, label: 'Fleet' },
    { path: '/schedules', icon: <MapPin size={18} />, label: 'Schedules' },
    { path: '/routes', icon: <Route size={18} />, label: 'Routes' },
    { path: '/bookings', icon: <Ticket size={18} />, label: 'Bookings' },
    { path: '/users', icon: <Users size={18} />, label: 'Users' },
    { path: '/bus-requests', icon: <MessageSquare size={18} />, label: 'Requests' },
  ];

  return (
    <div className="app-shell">
      {/* ── Top Header Bar ── */}
      <header className="app-header">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <div className="logo-icon-box">
              <span className="logo-arrow">▲</span>
            </div>
            <span className="logo-wordmark">Routie<span className="logo-accent">Admin</span></span>
          </Link>
        </div>

        <nav className="header-nav">
          <div className="nav-pill-track">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-pill ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="header-right">
          <button
            className="hdr-icon-btn"
            onClick={toggleTheme}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="hdr-icon-btn notif-btn">
            <Bell size={18} />
            <span className="notif-dot"></span>
          </button>

          <Link
            to="/settings"
            className={`hdr-icon-btn ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
          </Link>

          <div className="hdr-divider"></div>

          <div className="hdr-profile">
            <div className="hdr-avatar">
              <User size={16} />
            </div>
            <button className="hdr-logout" onClick={logout} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="app-main">
        <Outlet />
      </main>

      <style jsx>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-main);
        }

        /* ─── Header ─── */
        .app-header {
          height: 72px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: var(--shadow-xs);
        }

        /* Logo */
        .header-left { display: flex; align-items: center; }
        .logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon-box {
          width: 34px;
          height: 34px;
          background: var(--primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,102,255,0.25);
        }
        .logo-arrow {
          color: white;
          font-size: 14px;
          line-height: 1;
        }
        .logo-wordmark {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.04em;
        }
        .logo-accent {
          font-weight: 600;
          color: var(--text-muted);
        }

        /* Navigation Pills */
        .header-nav {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .nav-pill-track {
          background: var(--bg-main);
          border: 1px solid var(--border);
          padding: 5px;
          border-radius: 50px;
          display: flex;
          gap: 4px;
        }
        .nav-pill {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }
        .nav-pill:hover {
          color: var(--text-main);
          background: var(--border-light);
        }
        .nav-pill.active {
          color: #fff;
          background: var(--primary);
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.3);
        }

        /* Header Right */
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hdr-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .hdr-icon-btn:hover {
          background: var(--bg-main);
          color: var(--text-main);
          border-color: var(--text-muted);
        }
        .hdr-icon-btn.active {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid var(--bg-card);
        }
        .hdr-divider {
          width: 1px;
          height: 28px;
          background: var(--border);
          margin: 0 4px;
        }
        .hdr-profile {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hdr-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,102,255,0.2);
        }
        .hdr-logout {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
        }
        .hdr-logout:hover {
          color: var(--accent-red);
          background: rgba(239,68,68,0.08);
        }

        /* ─── Main ─── */
        .app-main {
          flex: 1;
          padding: 28px 32px 40px;
          max-width: 1540px;
          width: 100%;
          margin: 0 auto;
        }

        /* ─── Responsive ─── */
        @media (max-width: 1100px) {
          .header-nav {
            position: static;
            transform: none;
          }
          .app-header {
            gap: 16px;
          }
          .logo-wordmark { display: none; }
        }
        @media (max-width: 768px) {
          .app-header {
            padding: 0 16px;
            height: 64px;
          }
          .nav-pill-track {
            padding: 3px;
            gap: 2px;
          }
          .nav-pill {
            width: 34px;
            height: 34px;
          }
          .app-main {
            padding: 16px;
          }
          .hdr-divider, .hdr-logout { display: none; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
