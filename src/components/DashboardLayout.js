import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  Calendar,
  Route,
  Ticket,
  MessageSquare,
  Users,
  Settings,
  PieChart,
  Moon,
  Sun,
  LogOut,
  User,
  Navigation,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const DashboardLayout = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', icon: <Navigation size={18} />, label: 'Live Tracking' },
    { path: '/overview', icon: <PieChart size={18} />, label: 'Analytics' },
    { path: '/buses', icon: <Bus size={18} />, label: 'Fleet' },
    { path: '/schedules', icon: <Calendar size={18} />, label: 'Schedules' },
    { path: '/routes', icon: <Route size={18} />, label: 'Routes' },
    { path: '/bookings', icon: <Ticket size={18} />, label: 'Bookings' },
    { path: '/users', icon: <Users size={18} />, label: 'Users' },
    { path: '/bus-requests', icon: <MessageSquare size={18} />, label: 'Requests' },
  ];

  /* ── Sidebar links shared between desktop & mobile drawer ── */
  const NavLinks = ({ showLabel, onClose }) => (
    <>
      {navItems.map((item) => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`sb-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title={!showLabel ? item.label : ''}
          >
            <span className="sb-link-icon">{item.icon}</span>
            {showLabel && <span className="sb-link-label">{item.label}</span>}
            {showLabel && isActive && <ChevronRight size={13} className="sb-chevron" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="app-shell">

      {/* ─────────────────── Desktop Sidebar ─────────────────── */}
      <aside
        className={`sidebar ${hovered ? 'sidebar-open' : 'sidebar-closed'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <span>▲</span>
          </div>
          {hovered && (
            <span className="sb-logo-word">
              Routie<span className="sb-logo-accent">Admin</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="sb-nav">
          <NavLinks showLabel={hovered} />
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <Link
            to="/settings"
            className={`sb-link ${location.pathname === '/settings' ? 'active' : ''}`}
            title={!hovered ? 'Settings' : ''}
          >
            <span className="sb-link-icon"><Settings size={18} /></span>
            {hovered && <span className="sb-link-label">Settings</span>}
          </Link>

          <button
            className="sb-link theme-btn"
            onClick={toggleTheme}
            title={!hovered ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''}
          >
            <span className="sb-link-icon">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            {hovered && (
              <span className="sb-link-label">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="sb-profile">
            <div className="sb-avatar"><User size={14} /></div>
            {hovered && (
              <>
                <div className="sb-profile-text">
                  <span className="sb-profile-name">{user?.name || 'Admin'}</span>
                  <span className="sb-profile-role">Administrator</span>
                </div>
                <button className="sb-logout" onClick={logout} title="Logout">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────── Mobile Topbar ─────────────────── */}
      <header className="mobile-bar">
        <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="mobile-logo">
          <div className="sb-logo-icon sm"><span>▲</span></div>
          <span className="sb-logo-word">
            Routie<span className="sb-logo-accent">Admin</span>
          </span>
        </div>
        <button className="mobile-theme-btn" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      {/* ─────────────────── Mobile Drawer ─────────────────── */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="sb-logo" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sb-logo-icon"><span>▲</span></div>
                <span className="sb-logo-word">
                  Routie<span className="sb-logo-accent">Admin</span>
                </span>
              </div>
              <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <nav className="sb-nav" style={{ padding: '12px 10px 8px' }}>
              <NavLinks showLabel={true} onClose={() => setMobileOpen(false)} />
            </nav>

            <div className="sb-footer" style={{ padding: '10px 10px 18px' }}>
              <Link
                to="/settings"
                className={`sb-link ${location.pathname === '/settings' ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sb-link-icon"><Settings size={18} /></span>
                <span className="sb-link-label">Settings</span>
              </Link>
              <button className="sb-link theme-btn" onClick={toggleTheme}>
                <span className="sb-link-icon">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </span>
                <span className="sb-link-label">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
              <div className="sb-profile">
                <div className="sb-avatar"><User size={14} /></div>
                <div className="sb-profile-text">
                  <span className="sb-profile-name">{user?.name || 'Admin'}</span>
                  <span className="sb-profile-role">Administrator</span>
                </div>
                <button className="sb-logout" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ─────────────────── Main Content ─────────────────── */}
      <main className="app-main">
        <Outlet />
      </main>

      <style>{`
        /* ─── Base shell: horizontal flex ─── */
        .app-shell {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
          background: var(--bg-main);
        }

        /* ─── Desktop Sidebar ─── */
        .sidebar {
          height: 100vh;
          position: sticky;
          top: 0;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 200;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          box-shadow: 4px 0 24px rgba(0,0,0,0.06);
        }
        [data-theme='dark'] .sidebar {
          border-color: rgba(255,255,255,0.04);
        }
        .sidebar-closed { width: 64px; }
        .sidebar-open   { width: 232px; }

        /* ── Inner scroll ── */
        .sidebar > * { overflow: hidden; }
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 8px 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          scrollbar-width: none;
        }
        .sb-nav::-webkit-scrollbar { display: none; }

        /* ── Logo ── */
        .sb-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 14px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          min-height: 62px;
          white-space: nowrap;
        }
        .sb-logo-icon {
          width: 32px;
          height: 32px;
          min-width: 32px;
          background: #6366F1;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(99,102,241,0.45);
          font-size: 13px;
          color: white;
          font-weight: 800;
          flex-shrink: 0;
        }
        .sb-logo-icon.sm {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: 8px;
        }
        .sb-logo-word {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.04em;
          flex: 1;
          animation: sbFade 0.18s ease;
        }
        .sb-logo-accent {
          font-weight: 500;
          color: var(--text-muted);
        }

        /* ── Links ── */
        .sb-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 10px;
          border-radius: 10px;
          color: var(--text-muted);
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          transition: background 0.16s ease, color 0.16s ease;
          cursor: pointer;
          background: transparent;
          border: none;
          text-align: left;
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          min-height: 42px;
          text-decoration: none;
        }
        .sb-link:hover {
          color: var(--text-main);
          background: var(--bg-main);
        }
        .sb-link.active {
          background: #6366F1;
          color: #fff;
          font-weight: 600;
          box-shadow: 0 3px 14px rgba(99,102,241,0.32);
        }
        .sb-link-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          min-width: 20px;
          flex-shrink: 0;
        }
        .sb-link-label {
          flex: 1;
          animation: sbFade 0.18s ease;
        }
        .sb-chevron {
          opacity: 0.55;
          flex-shrink: 0;
          animation: sbFade 0.18s ease;
        }
        @keyframes sbFade {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── Footer ── */
        .sb-footer {
          padding: 8px 8px 14px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .theme-btn { }

        /* ── Profile strip ── */
        .sb-profile {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 10px 2px;
          margin-top: 4px;
          border-top: 1px solid var(--border);
          white-space: nowrap;
          overflow: hidden;
        }
        .sb-avatar {
          width: 30px;
          height: 30px;
          min-width: 30px;
          border-radius: 50%;
          background: #6366F1;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(99,102,241,0.28);
          flex-shrink: 0;
        }
        .sb-profile-text {
          flex: 1;
          min-width: 0;
          animation: sbFade 0.18s ease;
        }
        .sb-profile-name {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-main);
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-profile-role {
          display: block;
          font-size: 9.5px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .sb-logout {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 5px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: all 0.18s;
          animation: sbFade 0.18s ease;
        }
        .sb-logout:hover {
          color: #EF4444;
          background: rgba(239,68,68,0.1);
        }

        /* ─── Main content ─── */
        .app-main {
          flex: 1;
          min-width: 0;
          padding: 28px 32px 40px;
          transition: none;
        }
        /* Live Tracking: full bleed */
        .app-main:has(.lt-page) {
          padding: 0;
        }

        /* ─── Mobile Topbar (hidden on desktop) ─── */
        .mobile-bar { display: none; }

        /* ─── Mobile Drawer ─── */
        .mobile-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.52);
          backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex;
        }
        .mobile-drawer {
          width: 262px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border-right: 1px solid var(--border);
          animation: slideIn 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .mobile-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          transition: color 0.2s;
        }
        .mobile-close-btn:hover { color: var(--text-main); background: var(--bg-main); }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .app-shell { flex-direction: column; }
          .sidebar { display: none; }

          .mobile-bar {
            display: flex;
            align-items: center;
            height: 56px;
            padding: 0 16px;
            gap: 12px;
            background: #0F1117;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            position: sticky;
            top: 0;
            z-index: 100;
            flex-shrink: 0;
          }
          .mobile-hamburger {
            width: 34px; height: 34px;
            border-radius: 50%;
            background: rgba(255,255,255,0.07);
            border: none;
            color: rgba(255,255,255,0.75);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
          }
          .mobile-logo {
            display: flex; align-items: center; gap: 8px;
            flex: 1;
          }
          .mobile-theme-btn {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: rgba(255,255,255,0.07);
            border: none;
            color: rgba(255,255,255,0.65);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
          }

          .app-main {
            padding: 16px !important;
          }
          .app-main:has(.lt-page) {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
