import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { RefreshCw, Clock, X, FileDown, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load all lookup tables (buses, drivers, routes) for dropdowns
  const fetchLookups = useCallback(async () => {
    try {
      const [{ data: bData }, { data: rData }, { data: dData }] = await Promise.all([
        supabase.from('buses').select('id, vehicle_reg_number'),
        supabase.from('routes').select('id, route_number, route_name, origin, destination, stops'),
        supabase.from('profiles').select('id, full_name').eq('role', 'DRIVER'),
      ]);
      setBuses(bData || []);
      setRoutes(rData || []);
      setDrivers(dData || []);
    } catch (err) {
      console.error('Error fetching lookups:', err.message);
    }
  }, []);

  // Two-step fetch: schedules first, then merge driver names
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_schedules')
        .select('id, departure_date, departure_time, status, live_lat, live_lng, bus_id, driver_id, route_id, origin, destination, buses ( vehicle_reg_number ), routes ( route_number, route_name )')
        .order('departure_date', { ascending: false });
      if (error) throw error;

      const scheduleList = data || [];

      // Step 2: fetch driver names for all unique driver_ids
      const driverIds = [...new Set(scheduleList.filter(s => s.driver_id).map(s => s.driver_id))];
      let driverMap = {};
      if (driverIds.length > 0) {
        const { data: driverData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', driverIds);
        (driverData || []).forEach(d => { driverMap[d.id] = d.full_name; });
      }

      setSchedules(scheduleList.map(s => ({
        ...s,
        bus_reg: s.buses?.vehicle_reg_number || 'N/A',
        route_display: s.routes ? `${s.routes.route_number} – ${s.routes.route_name}` : 'N/A',
        driver_name: driverMap[s.driver_id] || 'Unassigned',
      })));
    } catch (err) {
      console.error('Error fetching schedules:', err.message);
      notify('Error loading schedules', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchLookups();
  }, [fetchSchedules, fetchLookups]);

  const openCreate = () => setModal({ mode: 'create', data: { status: 'SCHEDULED' } });
  const openEdit = (row) => setModal({ mode: 'edit', data: { ...row } });

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const d = modal.data;
    try {
      const payload = {
        bus_id: d.bus_id || null,
        driver_id: d.driver_id || null,
        route_id: d.route_id || null,
        departure_date: d.departure_date,
        departure_time: d.departure_time,
        status: d.status,
        origin: d.origin || null,
        destination: d.destination || null,
      };

      let error;
      if (modal.mode === 'create') {
        ({ error } = await supabase.from('trip_schedules').insert([payload]));
        if (!error) notify('✅ Schedule created successfully!');
      } else {
        ({ error } = await supabase.from('trip_schedules').update(payload).eq('id', d.id));
        if (!error) notify('✅ Schedule updated successfully!');
      }
      if (error) throw error;
      setModal(null);
      fetchSchedules();
    } catch (err) {
      notify('❌ Save failed: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this trip schedule?')) return;
    try {
      const { error } = await supabase.from('trip_schedules').delete().eq('id', row.id);
      if (error) throw error;
      notify('Schedule deleted');
      fetchSchedules();
    } catch (err) {
      notify('Delete failed: ' + err.message, 'error');
    }
  };

  const updateField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const columns = [
    { header: 'Bus', accessor: 'bus_reg' },
    { header: 'Driver', accessor: 'driver_name' },
    { header: 'Route', accessor: 'route_display' },
    { header: 'Origin', accessor: 'origin', render: (v) => v || '—' },
    { header: 'Destination', accessor: 'destination', render: (v) => v || '—' },
    {
      header: 'Departure', accessor: 'departure_date',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{row.departure_date || '—'}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {row.departure_time || '—'}
          </span>
        </div>
      )
    },
    {
      header: 'Status', accessor: 'status',
      render: (v) => <span className={`s-pill ${(v || '').toLowerCase()}`}>{v}</span>
    },
    {
      header: 'Live', accessor: 'live_lat',
      render: (_, row) => (
        <span className="s-live">
          <span className={`s-dot ${row.live_lat ? 'on' : ''}`}></span>
          {row.live_lat ? `${Number(row.live_lat).toFixed(4)}, ${Number(row.live_lng).toFixed(4)}` : 'Offline'}
        </span>
      )
    },
  ];

  const pdfColumns = [
    { header: 'Bus', accessor: 'bus_reg' },
    { header: 'Driver', accessor: 'driver_name' },
    { header: 'Route', accessor: 'route_display' },
    { header: 'Date', accessor: 'departure_date' },
    { header: 'Time', accessor: 'departure_time' },
    { header: 'Status', accessor: 'status' },
  ];

  const tableActions = (
    <>
      <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plus size={14} /> Create Schedule
      </button>
      <button className="btn btn-secondary" onClick={() => exportToPDF('Trip_Schedules', pdfColumns, schedules)}>
        <FileDown size={14} /> Export PDF
      </button>
      <button className="btn btn-secondary" onClick={fetchSchedules}>
        <RefreshCw size={14} /> Refresh
      </button>
    </>
  );

  const selectedRouteStops = React.useMemo(() => {
    if (!modal?.data?.route_id) return [];
    const route = routes.find(r => r.id === modal.data.route_id);
    if (!route || !route.stops) return [];
    try {
      return Array.isArray(route.stops) ? route.stops : JSON.parse(route.stops);
    } catch (e) {
      return [];
    }
  }, [modal?.data?.route_id, routes]);

  return (
    <div className="page-schedules">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {loading ? (
        <div className="loading-state">Loading trip schedules...</div>
      ) : (
        <DataTable
          title="Trip Schedules"
          columns={columns}
          data={schedules}
          actions={tableActions}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box ov-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modal.mode === 'create' ? '+ Create Schedule' : 'Edit Schedule'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="fg">
                <label>Bus</label>
                <select value={modal.data.bus_id || ''} onChange={e => updateField('bus_id', e.target.value)} required>
                  <option value="" disabled>— Select a bus —</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.vehicle_reg_number}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Driver</label>
                <select value={modal.data.driver_id || ''} onChange={e => updateField('driver_id', e.target.value)} required>
                  <option value="" disabled>— Select a driver —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Route</label>
                <select value={modal.data.route_id || ''} onChange={e => {
                  updateField('route_id', e.target.value);
                  updateField('origin', ''); // Reset origin/destination when route changes
                  updateField('destination', '');
                }} required>
                  <option value="" disabled>— Select a route —</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_number} – {r.route_name}</option>
                  ))}
                </select>
              </div>
              <div className="fg-row">
                <div className="fg">
                  <label>Origin</label>
                  <select 
                    value={modal.data.origin || ''} 
                    onChange={e => updateField('origin', e.target.value)} 
                    required 
                    disabled={!modal.data.route_id}
                  >
                    <option value="" disabled>— Select Origin —</option>
                    {selectedRouteStops.map(stop => (
                      <option key={stop} value={stop}>{stop}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label>Destination</label>
                  <select 
                    value={modal.data.destination || ''} 
                    onChange={e => updateField('destination', e.target.value)} 
                    required 
                    disabled={!modal.data.route_id}
                  >
                    <option value="" disabled>— Select Destination —</option>
                    {selectedRouteStops.map(stop => (
                      <option key={stop} value={stop}>{stop}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="fg-row">
                <div className="fg">
                  <label>Departure Date</label>
                  <input type="date" value={modal.data.departure_date || ''} onChange={e => updateField('departure_date', e.target.value)} required />
                </div>
                <div className="fg">
                  <label>Departure Time</label>
                  <input type="time" value={modal.data.departure_time || ''} onChange={e => updateField('departure_time', e.target.value)} required />
                </div>
              </div>
              <div className="fg">
                <label>Status</label>
                <select value={modal.data.status || 'SCHEDULED'} onChange={e => updateField('status', e.target.value)}>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .s-pill { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .s-pill.scheduled { background: #E0F2FE; color: #0369A1; }
        .s-pill.live { background: #DCFCE7; color: #166534; animation: blink 2s infinite; }
        .s-pill.completed { background: #F1F5F9; color: #64748B; }
        .s-pill.cancelled { background: #FEF2F2; color: #B91C1C; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .s-live { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
        .s-dot { width: 6px; height: 6px; border-radius: 50%; background: #94A3B8; flex-shrink: 0; }
        .s-dot.on { background: #22C55E; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-box { width: 100%; max-width: 520px; padding: 28px; margin: 16px; max-height: 90vh; overflow-y: auto; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-head h3 { font-size: 18px; font-weight: 700; }
        .modal-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
        .modal-close:hover { color: var(--text-main); background: var(--bg-main); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .fg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .fg { display: flex; flex-direction: column; gap: 6px; }
        .fg label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .fg input, .fg select { padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-main); color: var(--text-main); font-family: inherit; font-size: 14px; transition: border-color 0.2s; }
        .fg input:focus, .fg select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .fg input:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        
        .toast { position: fixed; top: 20px; right: 20px; padding: 14px 22px; border-radius: var(--radius-sm); color: white; font-weight: 600; font-size: 13px; z-index: 3000; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease; }
        .toast.success { background: var(--accent-green, #10B981); }
        .toast.error { background: var(--accent-red, #EF4444); }
        @keyframes slideIn { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Schedules;
