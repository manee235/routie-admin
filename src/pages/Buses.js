import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { Plus, RefreshCw, X, Filter, FileDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Buses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState('ALL');
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buses')
        .select(`id, vehicle_reg_number, ntc_number, bus_type, total_seats, status, driver_profiles ( profiles ( full_name ) )`);
      if (error) throw error;
      setBuses((data || []).map(b => ({
        ...b,
        driver_name: b.driver_profiles?.profiles?.full_name || 'Unassigned'
      })));
    } catch (err) {
      console.error('Error fetching buses:', err.message);
      notify('Error loading fleet data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  // Apply filters
  const filteredBuses = buses.filter(b => {
    if (filterType !== 'ALL' && b.bus_type !== filterType) return false;
    if (filterUnassigned && b.driver_name !== 'Unassigned') return false;
    return true;
  });

  const openAdd = () => setModal({ mode: 'add', data: { vehicle_reg_number: '', ntc_number: '', bus_type: 'INTERCITY', total_seats: 42, status: 'ACTIVE' } });
  const openEdit = (row) => setModal({ mode: 'edit', data: { ...row } });

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const d = modal.data;
    try {
      if (modal.mode === 'add') {
        const { error } = await supabase.from('buses').insert([{
          vehicle_reg_number: d.vehicle_reg_number,
          ntc_number: d.ntc_number,
          bus_type: d.bus_type,
          total_seats: Number(d.total_seats),
          status: d.status,
        }]);
        if (error) throw error;
        notify('Bus added successfully!');
      } else {
        const { error } = await supabase.from('buses').update({
          vehicle_reg_number: d.vehicle_reg_number,
          ntc_number: d.ntc_number,
          bus_type: d.bus_type,
          total_seats: Number(d.total_seats),
          status: d.status,
        }).eq('id', d.id);
        if (error) throw error;
        notify('Bus updated successfully!');
      }
      setModal(null);
      fetchBuses();
    } catch (err) {
      notify('Save failed (RLS): ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete bus "${row.vehicle_reg_number}"?`)) return;
    try {
      const { error } = await supabase.from('buses').delete().eq('id', row.id);
      if (error) throw error;
      notify('Bus deleted');
      fetchBuses();
    } catch (err) {
      notify('Delete failed: ' + err.message, 'error');
    }
  };

  const updateField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const columns = [
    { header: 'Vehicle Reg', accessor: 'vehicle_reg_number', width: '140px' },
    { header: 'NTC No', accessor: 'ntc_number' },
    { header: 'Type', accessor: 'bus_type', render: (v) => <span className={`b-badge ${(v||'').toLowerCase()}`}>{v}</span> },
    { header: 'Seats', accessor: 'total_seats', width: '80px' },
    { header: 'Status', accessor: 'status', render: (v) => <span className={`b-status ${(v||'').toLowerCase()}`}>{v}</span> },
    { header: 'Driver', accessor: 'driver_name', render: (v) => <span className={v === 'Unassigned' ? 'b-unassigned' : ''}>{v}</span> },
  ];

  const busTypes = ['ALL', ...new Set(buses.map(b => b.bus_type).filter(Boolean))];

  const pdfColumns = [
    { header: 'Vehicle Reg', accessor: 'vehicle_reg_number' },
    { header: 'NTC No', accessor: 'ntc_number' },
    { header: 'Type', accessor: 'bus_type' },
    { header: 'Seats', accessor: 'total_seats' },
    { header: 'Status', accessor: 'status' },
    { header: 'Driver', accessor: 'driver_name' },
  ];

  const tableActions = (
    <>
      <button className="btn btn-secondary" onClick={() => exportToPDF('Fleet_Management', pdfColumns, filteredBuses)}><FileDown size={14} /> Export PDF</button>
      <button className="btn btn-secondary" onClick={fetchBuses}><RefreshCw size={14} /> Refresh</button>
      <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Bus</button>
    </>
  );

  return (
    <div className="page-buses">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* ── Filter Bar ── */}
      <div className="filter-bar ov-card">
        <div className="filter-label"><Filter size={15} /> Filters</div>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Bus Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              {busTypes.map(t => (
                <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-check">
              <input
                type="checkbox"
                checked={filterUnassigned}
                onChange={e => setFilterUnassigned(e.target.checked)}
              />
              <span>Unassigned Only</span>
            </label>
          </div>
          {(filterType !== 'ALL' || filterUnassigned) && (
            <button className="filter-clear" onClick={() => { setFilterType('ALL'); setFilterUnassigned(false); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading fleet data...</div>
      ) : (
        <DataTable title="Fleet Management" columns={columns} data={filteredBuses} actions={tableActions} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modal.mode === 'add' ? 'Add New Bus' : 'Edit Bus'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="fg"><label>Vehicle Reg Number</label><input value={modal.data.vehicle_reg_number} onChange={e => updateField('vehicle_reg_number', e.target.value)} required /></div>
              <div className="fg"><label>NTC Number</label><input value={modal.data.ntc_number} onChange={e => updateField('ntc_number', e.target.value)} required /></div>
              <div className="fg"><label>Bus Type</label>
                <select value={modal.data.bus_type} onChange={e => updateField('bus_type', e.target.value)}>
                  <option value="INTERCITY">INTERCITY</option><option value="NORMAL">NORMAL</option><option value="CTB">CTB</option>
                </select>
              </div>
              <div className="fg"><label>Total Seats</label><input type="number" value={modal.data.total_seats} onChange={e => updateField('total_seats', e.target.value)} required /></div>
              <div className="fg"><label>Status</label>
                <select value={modal.data.status} onChange={e => updateField('status', e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option><option value="MAINT">MAINTENANCE</option><option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Filter Bar ── */
        .filter-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
        }
        .filter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          flex: 1;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .filter-group > label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-main);
          color: var(--text-main);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          min-width: 140px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .filter-group select:focus {
          outline: none;
          border-color: var(--primary);
        }
        .filter-check {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-main);
          padding: 8px 0;
          margin-top: 14px;
        }
        .filter-check input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--primary);
          cursor: pointer;
        }
        .filter-clear {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 14px;
        }
        .filter-clear:hover {
          color: var(--accent-red);
          border-color: var(--accent-red);
          background: rgba(239, 68, 68, 0.05);
        }

        /* ── Badges ── */
        .b-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .b-badge.intercity { background: #E0F2FE; color: #0369A1; }
        .b-badge.normal { background: var(--border-light); color: var(--text-secondary); }
        .b-badge.ctb { background: #FEF2F2; color: #B91C1C; }
        .b-status { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12px; }
        .b-status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; }
        .b-status.active::before { background: var(--accent-green); box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
        .b-status.maint::before { background: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
        .b-status.inactive::before { background: #94A3B8; }
        .b-unassigned { color: var(--accent-orange); font-weight: 600; font-style: italic; }

        /* ── Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { width: 100%; max-width: 480px; padding: 28px; margin: 16px; }
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

        /* ── Toast ── */
        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green); }
        .toast.error { background: var(--accent-red); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        @media (max-width: 768px) {
          .filter-bar { padding: 12px 16px; }
          .filter-controls { flex-direction: column; align-items: flex-start; }
          .filter-check { margin-top: 0; }
          .filter-clear { margin-top: 0; }
        }
      `}</style>
    </div>
  );
};

export default Buses;
