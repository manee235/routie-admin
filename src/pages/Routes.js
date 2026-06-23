import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { Plus, RefreshCw, X, FileDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', data: {...} }
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const seedRoutes = [
    { id: 's1', route_number: '138', route_name: 'Colombo - Maharagama', origin: 'Colombo Fort', destination: 'Maharagama', stops: ['Town Hall', 'Bambalapitiya', 'Nugegoda'], is_active: true },
    { id: 's2', route_number: '122', route_name: 'Colombo - Ratnapura', origin: 'Colombo Fort', destination: 'Ratnapura', stops: ['Highlevel Rd', 'Avissawella', 'Eheliyagoda'], is_active: true },
    { id: 's3', route_number: 'EX01', route_name: 'Colombo - Matara (Express)', origin: 'Makumbura', destination: 'Matara', stops: ['Galle'], is_active: true },
  ];

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routes').select('*');
      if (error) throw error;
      setRoutes(data && data.length > 0 ? data : seedRoutes);
    } catch (err) {
      console.error('Error fetching routes:', err.message);
      setRoutes(seedRoutes);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const openAdd = () => setModal({
    mode: 'add',
    data: { route_number: '', route_name: '', origin: '', destination: '', stops_str: '', is_active: true }
  });

  const openEdit = (row) => setModal({
    mode: 'edit',
    data: { ...row, stops_str: Array.isArray(row.stops) ? row.stops.join(', ') : '' }
  });

  const updateField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const d = modal.data;
    const stopsArray = d.stops_str ? d.stops_str.split(',').map(s => s.trim()) : [];
    const payload = {
      route_number: d.route_number,
      route_name: d.route_name,
      origin: d.origin,
      destination: d.destination,
      stops: stopsArray,
      is_active: d.is_active,
    };

    try {
      if (modal.mode === 'add') {
        const { error } = await supabase.from('routes').insert([payload]);
        if (error) throw error;
        notify('Route created!');
      } else {
        const { error } = await supabase.from('routes').update(payload).eq('id', d.id);
        if (error) throw error;
        notify('Route updated!');
      }
      setModal(null);
      fetchRoutes();
    } catch (err) {
      // Fallback to local state
      if (modal.mode === 'add') {
        const localRoute = { ...payload, id: 'local_' + Date.now(), stops: stopsArray };
        setRoutes(prev => [localRoute, ...prev]);
        notify('Saved locally (Supabase restricted)', 'warning');
      } else {
        setRoutes(prev => prev.map(r => r.id === d.id ? { ...r, ...payload, stops: stopsArray } : r));
        notify('Updated locally (Supabase restricted)', 'warning');
      }
      setModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete route "${row.route_name}"?`)) return;
    try {
      const { error } = await supabase.from('routes').delete().eq('id', row.id);
      if (error) throw error;
      notify('Route deleted!');
      fetchRoutes();
    } catch (err) {
      // Fallback: remove from local state
      setRoutes(prev => prev.filter(r => r.id !== row.id));
      notify('Removed locally', 'warning');
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!window.confirm(`Delete ${selectedIds.length} selected routes?`)) return;
    try {
      const { error } = await supabase.from('routes').delete().in('id', selectedIds);
      if (error) throw error;
      notify('Selected routes deleted!');
      fetchRoutes();
    } catch (err) {
      // Fallback: remove from local state
      setRoutes(prev => prev.filter(r => !selectedIds.includes(r.id)));
      notify('Removed locally', 'warning');
    }
  };

  const columns = [
    { header: 'Route No', accessor: 'route_number', width: '100px' },
    { header: 'Route Name', accessor: 'route_name' },
    { header: 'Origin', accessor: 'origin' },
    { header: 'Destination', accessor: 'destination' },
    {
      header: 'Stops', accessor: 'stops',
      render: (val) => <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{Array.isArray(val) ? `${val.length} Stops` : '0 Stops'}</span>
    },
    {
      header: 'Status', accessor: 'is_active',
      render: (val) => <span className={`rt-pill ${val ? 'active' : 'inactive'}`}>{val ? 'Active' : 'Inactive'}</span>
    },
  ];

  const pdfColumns = [
    { header: 'Route No', accessor: 'route_number' },
    { header: 'Route Name', accessor: 'route_name' },
    { header: 'Origin', accessor: 'origin' },
    { header: 'Destination', accessor: 'destination' },
    { header: 'Active', accessor: 'is_active' },
  ];

  const tableActions = (
    <>
      <button className="btn btn-secondary" onClick={() => exportToPDF('Route_Network', pdfColumns, routes)}><FileDown size={14} /> Export PDF</button>
      <button className="btn btn-secondary" onClick={fetchRoutes}><RefreshCw size={14} /> Refresh</button>
      <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> New Route</button>
    </>
  );

  return (
    <div className="page-routes">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {loading ? (
        <div className="loading-state">Loading routes...</div>
      ) : (
        <DataTable
          title="Route Network"
          columns={columns}
          data={routes}
          actions={tableActions}
          onEdit={openEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modal.mode === 'add' ? 'Create New Route' : 'Edit Route'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="fg"><label>Route Number</label><input value={modal.data.route_number} onChange={e => updateField('route_number', e.target.value)} placeholder="e.g. 138" required /></div>
              <div className="fg"><label>Route Name</label><input value={modal.data.route_name} onChange={e => updateField('route_name', e.target.value)} placeholder="e.g. Colombo - Maharagama" required /></div>
              <div className="fg"><label>Origin</label><input value={modal.data.origin} onChange={e => updateField('origin', e.target.value)} placeholder="e.g. Colombo Fort" required /></div>
              <div className="fg"><label>Destination</label><input value={modal.data.destination} onChange={e => updateField('destination', e.target.value)} placeholder="e.g. Maharagama" required /></div>
              <div className="fg"><label>Stops (comma separated)</label><input value={modal.data.stops_str} onChange={e => updateField('stops_str', e.target.value)} placeholder="e.g. Town Hall, Bambalapitiya" /></div>
              <div className="fg"><label>Status</label>
                <select value={modal.data.is_active ? 'true' : 'false'} onChange={e => updateField('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Route'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .rt-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; letter-spacing: 0.02em; }
        .rt-pill.active { background: rgba(16, 185, 129, 0.12); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .rt-pill.inactive { background: rgba(148, 163, 184, 0.12); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.2); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { width: 100%; max-width: 500px; padding: 28px; margin: 16px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-head h3 { font-size: 18px; }
        .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { color: var(--text-main); background: var(--bg-main); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .fg input, .fg select { padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 14px; }
        .fg input:focus, .fg select:focus { outline: none; border-color: var(--primary); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green); }
        .toast.warning { background: var(--accent-orange); }
        .toast.error { background: var(--accent-red); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default RoutesPage;
