import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { FileDown, RefreshCw, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Users = () => {
  const [activeTab, setActiveTab] = useState('passengers');
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: passengerData, error: pe } = await supabase
        .from('profiles')
        .select(`id, full_name, created_at, passenger_profiles ( phone_number, nic, address )`)
        .eq('role', 'PASSENGER');
      if (pe) throw pe;
      setPassengers((passengerData || []).map(p => ({
        id: p.id, full_name: p.full_name, created_at: p.created_at,
        phone_number: p.passenger_profiles?.phone_number || 'N/A',
        nic: p.passenger_profiles?.nic || 'N/A',
        address: p.passenger_profiles?.address || 'N/A'
      })));
      const { data: driverData, error: de } = await supabase
        .from('profiles')
        .select(`id, full_name, driver_profiles ( nic, driving_license_number, ntc_driver_regno, verification_status, updated_at )`)
        .eq('role', 'DRIVER');
      if (de) throw de;
      setDrivers((driverData || []).map(d => ({
        id: d.id, full_name: d.full_name,
        nic: d.driver_profiles?.nic || 'N/A',
        driving_license_number: d.driver_profiles?.driving_license_number || 'N/A',
        ntc_driver_regno: d.driver_profiles?.ntc_driver_regno || 'N/A',
        verification_status: d.driver_profiles?.verification_status || 'PENDING',
        updated_at: d.driver_profiles?.updated_at || ''
      })));
    } catch (error) {
      console.error('Error fetching users:', error.message);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // fetchUsers is defined above via useCallback

  const handleEdit = (row) => {
    setEditModal({ ...row, _tab: activeTab });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editModal.full_name })
        .eq('id', editModal.id);
      if (error) throw error;
      showToast('User updated successfully!');
      setEditModal(null);
      fetchUsers();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete user "${row.full_name}"?`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', row.id);
      if (error) throw error;
      showToast('User deleted');
      fetchUsers();
    } catch (err) {
      showToast('Delete failed (RLS may block this): ' + err.message, 'error');
    }
  };

  const passengerColumns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Phone', accessor: 'phone_number' },
    { header: 'NIC', accessor: 'nic' },
    { header: 'Address', accessor: 'address' },
    { header: 'Joined', accessor: 'created_at', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  const driverColumns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'NIC', accessor: 'nic' },
    { header: 'License', accessor: 'driving_license_number' },
    { header: 'NTC Reg', accessor: 'ntc_driver_regno' },
    {
      header: 'Status', accessor: 'verification_status',
      render: (val) => (
        <span className={`u-badge ${(val || 'pending').toLowerCase()}`}>{val || 'PENDING'}</span>
      )
    },
  ];

  const handleExportPDF = () => {
    if (activeTab === 'passengers') {
      exportToPDF('Passenger_Directory', passengerColumns, passengers);
    } else {
      exportToPDF('Driver_Directory', driverColumns, drivers);
    }
  };

  const actions = (
    <>
      <button className="btn btn-secondary" onClick={handleExportPDF}><FileDown size={14} /> Export PDF</button>
      <button className="btn btn-secondary" onClick={fetchUsers}><RefreshCw size={14} /> Refresh</button>
    </>
  );

  return (
    <div className="page-users">
      {notification && <div className={`toast ${notification.type}`}>{notification.msg}</div>}

      <div className="u-tabs">
        <button className={`u-tab ${activeTab === 'passengers' ? 'active' : ''}`} onClick={() => setActiveTab('passengers')}>
          Passengers
        </button>
        <button className={`u-tab ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>
          Drivers
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : activeTab === 'passengers' ? (
        <DataTable
          title="Passenger Directory"
          columns={passengerColumns}
          data={passengers}
          actions={actions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <DataTable
          title="Driver Directory"
          columns={driverColumns}
          data={drivers}
          actions={actions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="fg">
                <label>Full Name</label>
                <input value={editModal.full_name} onChange={e => setEditModal({ ...editModal, full_name: e.target.value })} required />
              </div>
              {editModal._tab === 'passengers' && (
                <>
                  <div className="fg"><label>Phone</label><input value={editModal.phone_number} disabled /></div>
                  <div className="fg"><label>NIC</label><input value={editModal.nic} disabled /></div>
                </>
              )}
              {editModal._tab === 'drivers' && (
                <>
                  <div className="fg"><label>License</label><input value={editModal.driving_license_number} disabled /></div>
                  <div className="fg"><label>Status</label><input value={editModal.verification_status} disabled /></div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .u-tabs { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .u-tab {
          padding: 12px 20px; background: transparent; color: var(--text-muted); font-weight: 600; font-size: 14px;
          border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s;
        }
        .u-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .u-tab:hover { color: var(--text-main); }
        .u-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
        .u-badge.verified { background: #ECFDF5; color: #047857; }
        .u-badge.pending { background: #FFF7ED; color: #C2410C; }
        .u-badge.rejected { background: #FEF2F2; color: #B91C1C; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { width: 100%; max-width: 480px; padding: 28px; margin: 16px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-head h3 { font-size: 18px; }
        .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { color: var(--text-main); background: var(--bg-main); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .fg input, .fg select {
          padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 14px;
          transition: border-color 0.2s;
        }
        .fg input:focus, .fg select:focus { outline: none; border-color: var(--primary); }
        .fg input:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }

        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green); }
        .toast.error { background: var(--accent-red); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Users;
