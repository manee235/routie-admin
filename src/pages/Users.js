import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { FileDown, RefreshCw, X, Filter } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Users = () => {
  const [activeTab, setActiveTab] = useState('passengers');
  const [passengers, setPassengers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverStatusFilter, setDriverStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Create User Form State
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', phone_number: '', nic: '', address: ''
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: passengerData, error: pe } = await supabase
        .from('profiles')
        .select(`id, full_name, created_at, profile_image_url, passenger_profiles ( phone_number, nic, address )`)
        .eq('role', 'PASSENGER');
      if (pe) throw pe;
      setPassengers((passengerData || []).map(p => ({
        id: p.id, full_name: p.full_name, created_at: p.created_at,
        profile_image_url: p.profile_image_url,
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

  const handleView = (row) => {
    setViewModal({ ...row, _tab: activeTab });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'PASSENGER'
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // 2. Insert into passenger_profiles
        const { error: ppError } = await supabase
          .from('passenger_profiles')
          .insert({
            id: authData.user.id,
            phone_number: formData.phone_number,
            nic: formData.nic,
            address: formData.address
          });
          
        if (ppError) console.error('Failed to insert passenger profile data', ppError);
      }
      
      showToast('User created successfully!');
      setCreateModal(false);
      setFormData({ full_name: '', email: '', password: '', phone_number: '', nic: '', address: '' });
      fetchUsers();
    } catch (err) {
      showToast('Error creating user: ' + err.message, 'error');
    }
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

  const handleBulkDelete = async (selectedIds) => {
    if (!window.confirm(`Delete ${selectedIds.length} selected users?`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().in('id', selectedIds);
      if (error) throw error;
      showToast('Selected users deleted');
      fetchUsers();
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const passengerColumns = [
    { 
      header: 'Name', 
      accessor: 'full_name',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {row.profile_image_url ? (
            <img src={row.profile_image_url} alt={val} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {val.charAt(0)}
            </div>
          )}
          <span>{val}</span>
        </div>
      )
    },
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
      {activeTab === 'passengers' && (
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Create User</button>
      )}
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
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      ) : (
        <>
          <div className="filter-bar ov-card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Filter Status:
            </span>
            <select 
              value={driverStatusFilter} 
              onChange={e => setDriverStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            {driverStatusFilter !== 'ALL' && (
              <button 
                onClick={() => setDriverStatusFilter('ALL')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Clear
              </button>
            )}
          </div>
          <DataTable
            title="Driver Directory"
            columns={driverColumns}
            data={drivers.filter(d => driverStatusFilter === 'ALL' || (d.verification_status || 'PENDING').toUpperCase() === driverStatusFilter)}
            actions={actions}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
          />
        </>
      )}

      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Passenger</h3>
              <button className="modal-close" onClick={() => setCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="fg">
                <label>Full Name</label>
                <input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
              </div>
              <div className="fg">
                <label>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="fg">
                <label>Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength="6" />
              </div>
              <div className="fg">
                <label>Phone Number</label>
                <input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
              </div>
              <div className="fg">
                <label>NIC</label>
                <input value={formData.nic} onChange={e => setFormData({ ...formData, nic: e.target.value })} />
              </div>
              <div className="fg">
                <label>Address</label>
                <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>User Profile</h3>
              <button className="modal-close" onClick={() => setViewModal(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {viewModal.profile_image_url ? (
                  <img src={viewModal.profile_image_url} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    {viewModal.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>{viewModal.full_name}</h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{viewModal._tab === 'passengers' ? 'Passenger' : 'Driver'}</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {viewModal._tab === 'passengers' ? (
                  <>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.phone_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NIC</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.nic}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.address}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NIC</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.nic}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>License</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.driving_license_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.verification_status}</div>
                    </div>
                  </>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>{viewModal.created_at ? new Date(viewModal.created_at).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
