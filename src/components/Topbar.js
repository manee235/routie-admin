import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, User, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Topbar = ({ collapsed, mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Overview';
      case '/users': return 'User Management';
      case '/buses': return 'Fleet Management';
      case '/schedules': return 'Trip Schedules';
      case '/routes': return 'Route Management';
      case '/bookings': return 'Bookings & Tickets';
      case '/requests': return 'Bus Assignment Requests';
      case '/settings': return 'Settings';
      default: return 'Routie Admin';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
        <h1>{getPageTitle(location.pathname)}</h1>
      </div>
      
      <div className="topbar-right">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>

        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Dark Mode">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button className="icon-btn notification-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">Super Admin</span>
          </div>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: 80px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .topbar-left h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 260px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 10px 16px 10px 44px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px;
          transition: var(--transition);
          color: var(--text-main);
        }

        .search-box input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 4px rgba(0, 86, 210, 0.05);
        }

        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          position: relative;
          transition: var(--transition);
        }

        .icon-btn:hover {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .notification-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: var(--accent-orange);
          border: 2px solid var(--bg-sidebar);
          border-radius: 50%;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 12px;
          border-left: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .user-role {
          font-size: 12px;
          color: var(--text-muted);
        }

        .user-avatar {
          width: 42px;
          height: 42px;
          background: var(--primary);
          color: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 86, 210, 0.2);
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          color: var(--text-main);
          border: none;
          padding: 4px;
        }

        @media (max-width: 768px) {
          .topbar {
            padding: 0 16px;
          }
          
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .search-box {
            display: none;
          }

          .user-info {
            display: none;
          }

          .user-profile {
            padding-left: 0;
            border-left: none;
          }
          
          .topbar-right {
            gap: 8px;
          }
          
          .icon-btn {
            width: 36px;
            height: 36px;
          }
          
          .user-avatar {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>
    </header>
  );
};

export default Topbar;
