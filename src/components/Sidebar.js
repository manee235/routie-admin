import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bus,
  Calendar,
  MapPin,
  Ticket,
  BellRing,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Users', icon: <Users size={20} />, path: '/users' },
    { name: 'Buses', icon: <Bus size={20} />, path: '/buses' },
    { name: 'Trip Schedules', icon: <Calendar size={20} />, path: '/schedules' },
    { name: 'Routes', icon: <MapPin size={20} />, path: '/routes' },
    { name: 'Bookings', icon: <Ticket size={20} />, path: '/bookings' },
    { name: 'Bus Requests', icon: <BellRing size={20} />, path: '/bus-requests' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <>
      {mobileMenuOpen && (
      <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
    )}
<aside className={`sidebar glass ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
  <button
    className="collapse-toggle"
    onClick={() => setCollapsed(!collapsed)}
  >
    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
  </button>

  <div className="sidebar-logo">
    <div className="logo-icon">R</div>
    {!collapsed && <span>Routie</span>}
  </div>

  <nav className="sidebar-nav">
    {menuItems.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        end={item.path === '/'}
        title={collapsed ? item.name : ''}
      >
        <span className="nav-icon">{item.icon}</span>
        {!collapsed && <span className="nav-label">{item.name}</span>}
      </NavLink>
    ))}
  </nav>

  <div className="sidebar-footer">


    <button className="logout-btn" onClick={logout}>
      <LogOut size={20} />
      {!collapsed && <span>Logout</span>}
    </button>
  </div>
</aside>

  <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.02);
        }

        .sidebar.collapsed {
          width: 88px;
          padding: 32px 14px;
        }

        .collapse-toggle {
          position: absolute;
          right: -12px;
          top: 40px;
          width: 24px;
          height: 24px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          margin-bottom: 48px;
          overflow: hidden;
        }

        .logo-icon {
          min-width: 36px;
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 20px;
          font-family: 'Outfit';
        }

        .sidebar-logo span {
          font-size: 24px;
          font-weight: 700;
          font-family: 'Outfit';
          color: var(--text-main);
          white-space: nowrap;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-weight: 500;
          transition: var(--transition);
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-item {
          padding: 12px;
          justify-content: center;
        }

        .nav-item:hover {
          background: rgba(79, 70, 229, 0.05);
          color: var(--primary);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          width: 100%;
          background: transparent;
          color: var(--text-muted);
          font-weight: 500;
          border-radius: var(--radius-md);
          transition: var(--transition);
        }

        .sidebar.collapsed .logout-btn {
          padding: 12px;
          justify-content: center;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          color: #EF4444;
        }

        .mobile-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: -280px;
            height: 100%;
            z-index: 1000;
            transition: left 0.3s ease;
          }

          .sidebar.mobile-open {
            left: 0;
            width: 280px;
          }

          .collapse-toggle {
            display: none;
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
          }
        }
      `}</style>
    </>
  );
};

  export default Sidebar;
