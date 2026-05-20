import React, { useState } from 'react';
import { Save, User, Bell, Shield, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [toast, setToast] = useState(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [sysAlerts, setSysAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page-settings">
      {toast && <div className="st-toast">{toast}</div>}

      <div className="st-grid">
        {/* Profile */}
        <div className="ov-card st-card">
          <div className="st-card-head">
            <h3><User size={18} /> Profile Settings</h3>
            <button className="btn btn-primary" onClick={() => notify('Settings saved!')}><Save size={14} /> Save</button>
          </div>
          <div className="st-form">
            <div className="fg"><label>Full Name</label><input type="text" defaultValue="Routie Admin" /></div>
            <div className="fg"><label>Email Address</label><input type="email" defaultValue="routie.admin.app@gmail.com" disabled /></div>
            <div className="fg"><label>Role</label><input type="text" defaultValue="Super Administrator" disabled /></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="ov-card st-card">
          <h3 className="st-card-title"><Bell size={18} /> Notifications</h3>
          <div className="st-list">
            <div className="st-item">
              <div><h4>Email Notifications</h4><p>Receive daily reports via email.</p></div>
              <div className={`st-toggle ${emailNotif ? 'on' : ''}`} onClick={() => setEmailNotif(!emailNotif)}></div>
            </div>
            <div className="st-item">
              <div><h4>System Alerts</h4><p>Notify on critical bus failures.</p></div>
              <div className={`st-toggle ${sysAlerts ? 'on' : ''}`} onClick={() => setSysAlerts(!sysAlerts)}></div>
            </div>
            <div className="st-item">
              <div><h4>Marketing Emails</h4><p>Receive updates about new features.</p></div>
              <div className={`st-toggle ${marketing ? 'on' : ''}`} onClick={() => setMarketing(!marketing)}></div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="ov-card st-card">
          <h3 className="st-card-title">{isDarkMode ? <Moon size={18} /> : <Sun size={18} />} Appearance</h3>
          <div className="st-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div><h4>Dark Mode</h4><p>Switch between light and dark theme.</p></div>
            <div className={`st-toggle ${isDarkMode ? 'on' : ''}`} onClick={toggleTheme}></div>
          </div>
        </div>

        {/* Security */}
        <div className="ov-card st-card">
          <h3 className="st-card-title"><Shield size={18} /> Security</h3>
          <div className="st-form">
            <div className="fg"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
            <div className="fg"><label>New Password</label><input type="password" placeholder="••••••••" /></div>
            <button className="btn btn-secondary" onClick={() => notify('Password updated!')}>Update Password</button>
          </div>
        </div>

        {/* System Config */}
        <div className="ov-card st-card">
          <h3 className="st-card-title"><Globe size={18} /> System Config</h3>
          <div className="st-form">
            <div className="fg"><label>Currency</label>
              <select><option>LKR (Rs.)</option><option>USD ($)</option></select>
            </div>
            <div className="fg"><label>Timezone</label>
              <select><option>UTC +5:30 (Colombo)</option><option>UTC +0:00 (London)</option></select>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .st-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 20px;
        }
        .st-card { padding: 24px; }
        .st-card-head {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
        }
        .st-card-head h3, .st-card-title {
          display: flex; align-items: center; gap: 10px; font-size: 16px; margin-bottom: 0;
        }
        .st-card-title { margin-bottom: 16px; }

        .st-form { display: flex; flex-direction: column; gap: 16px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .fg input, .fg select {
          padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 14px;
          transition: border-color 0.2s;
        }
        .fg input:focus, .fg select:focus { outline: none; border-color: var(--primary); }
        .fg input:disabled { opacity: 0.5; cursor: not-allowed; }

        .st-list { display: flex; flex-direction: column; }
        .st-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0; border-bottom: 1px solid var(--border);
        }
        .st-item:last-child { border-bottom: none; }
        .st-item h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .st-item p { font-size: 12px; color: var(--text-muted); }

        .st-toggle {
          width: 44px; height: 24px; background: var(--border); border-radius: 24px;
          position: relative; cursor: pointer; transition: background 0.25s ease; flex-shrink: 0;
        }
        .st-toggle::after {
          content: ''; position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; background: white; border-radius: 50%;
          transition: transform 0.25s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .st-toggle.on { background: var(--primary); }
        .st-toggle.on::after { transform: translateX(20px); }

        .st-toast {
          position: fixed; top: 20px; right: 20px; padding: 14px 22px;
          border-radius: var(--radius-sm); background: var(--accent-green); color: white;
          font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Settings;
