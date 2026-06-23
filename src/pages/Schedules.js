import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { RefreshCw, Clock, X, FileDown, Plus, Filter, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { exportToPDF } from '../utils/exportPDF';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [automateForm, setAutomateForm] = useState({ route_id: '', start_date: '', end_date: '', start_time: '06:00', end_time: '22:00' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Filters
  const [filterRoute, setFilterRoute] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLiveOnly, setFilterLiveOnly] = useState(false);
  const [filterBusType, setFilterBusType] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

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
        .select('id, departure_date, departure_time, status, live_lat, live_lng, bus_id, driver_id, route_id, origin, destination, buses ( vehicle_reg_number, bus_type ), routes ( route_number, route_name )')
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
        bus_type: s.buses?.bus_type || 'NORMAL',
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
      if (error) {
        // RLS or Foreign Key referencing bookings
        if (error.code === '23503') {
          if (window.confirm('This schedule has active ticket bookings and cannot be deleted. Would you like to cancel this schedule and all its bookings instead?')) {
            const { error: schedError } = await supabase
              .from('trip_schedules')
              .update({ status: 'CANCELLED' })
              .eq('id', row.id);
            if (schedError) throw schedError;
            
            const { error: bookError } = await supabase
              .from('bookings')
              .update({ status: 'CANCELLED' })
              .eq('trip_schedule_id', row.id);
            if (bookError) console.error('Failed to cancel bookings:', bookError);

            notify('Schedule and associated bookings cancelled successfully');
            fetchSchedules();
            return;
          } else {
            notify('Deletion cancelled', 'warning');
            return;
          }
        }
        throw error;
      }
      notify('Schedule deleted');
      fetchSchedules();
    } catch (err) {
      notify('Delete failed: ' + err.message, 'error');
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!window.confirm(`Delete ${selectedIds.length} selected trip schedules?`)) return;
    try {
      const { error } = await supabase.from('trip_schedules').delete().in('id', selectedIds);
      if (error) {
        if (error.code === '23503') {
          if (window.confirm('Some selected schedules have active bookings and cannot be deleted. Would you like to cancel these schedules and their bookings instead?')) {
            const { error: schedError } = await supabase
              .from('trip_schedules')
              .update({ status: 'CANCELLED' })
              .in('id', selectedIds);
            if (schedError) throw schedError;

            const { error: bookError } = await supabase
              .from('bookings')
              .update({ status: 'CANCELLED' })
              .in('trip_schedule_id', selectedIds);
            if (bookError) console.error('Failed to cancel bookings:', bookError);

            notify('Selected schedules and associated bookings cancelled successfully');
            fetchSchedules();
            return;
          } else {
            notify('Bulk deletion cancelled', 'warning');
            return;
          }
        }
        throw error;
      }
      notify('Selected schedules deleted');
      fetchSchedules();
    } catch (err) {
      notify('Bulk delete failed: ' + err.message, 'error');
    }
  };

  const handleAutomateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { route_id, start_date, end_date, start_time, end_time } = automateForm;
    
    try {
      const { data: routeBuses, error: busErr } = await supabase.from('buses').select('id, bus_type').eq('route_id', route_id);
      if (busErr) throw busErr;
      if (!routeBuses || routeBuses.length === 0) throw new Error('No buses assigned to this route. Assign buses in Fleet Management first.');

      const routeInfo = routes.find(r => r.id === route_id);
      const origin = routeInfo ? routeInfo.origin : null;
      const destination = routeInfo ? routeInfo.destination : null;

      let current = new Date(start_date);
      const end = new Date(end_date);
      const payloads = [];

      const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex > 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
      };

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dailyBuses = shuffle([...routeBuses]);
        let busIndex = 0;

        let [h, m] = start_time.split(':').map(Number);
        let [eh, em] = end_time.split(':').map(Number);
        let curTimeMins = h * 60 + m;
        let endTimeMins = eh * 60 + em;

        while (curTimeMins <= endTimeMins) {
          let th = Math.floor(curTimeMins / 60).toString().padStart(2, '0');
          let tm = (curTimeMins % 60).toString().padStart(2, '0');

          // Bus 1: Origin -> Destination
          const bus1 = dailyBuses[busIndex % dailyBuses.length];
          payloads.push({
            bus_id: bus1.id,
            route_id,
            departure_date: dateStr,
            departure_time: `${th}:${tm}`,
            status: 'SCHEDULED',
            origin,
            destination
          });

          // Bus 2: Destination -> Origin
          const bus2 = dailyBuses[(busIndex + 1) % dailyBuses.length];
          payloads.push({
            bus_id: bus2.id,
            route_id,
            departure_date: dateStr,
            departure_time: `${th}:${tm}`,
            status: 'SCHEDULED',
            origin: destination,
            destination: origin
          });

          busIndex = (busIndex + 2) % dailyBuses.length;
          curTimeMins += 15;
        }
        current.setDate(current.getDate() + 1);
      }

      if (payloads.length === 0) throw new Error('No schedules generated. Check date/time range.');

      // Insert in chunks of 500 to avoid PostgREST limits
      for (let i = 0; i < payloads.length; i += 500) {
        const chunk = payloads.slice(i, i + 500);
        const { error: insertErr } = await supabase.from('trip_schedules').insert(chunk);
        if (insertErr) throw insertErr;
      }

      notify(`Successfully automated ${payloads.length} schedules!`);
      // Optional: reset form or leave it
      fetchSchedules();

    } catch (error) {
      notify('Automation failed: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSchedules = async () => {
    if (!automateForm.route_id || !automateForm.start_date || !automateForm.end_date) {
      notify('Please select a route and date range to clear schedules.', 'warning');
      return;
    }
    if (!window.confirm(`Delete all SCHEDULED trips for this route between ${automateForm.start_date} and ${automateForm.end_date}?`)) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('trip_schedules')
        .delete()
        .eq('route_id', automateForm.route_id)
        .eq('status', 'SCHEDULED')
        .gte('departure_date', automateForm.start_date)
        .lte('departure_date', automateForm.end_date);

      if (error) throw error;
      notify('Automated schedules cleared successfully!');
      fetchSchedules();
    } catch (err) {
      notify('Clear failed: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
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

  const filteredSchedules = schedules.filter(s => {
    if (filterRoute !== 'ALL' && s.route_id !== filterRoute) return false;
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (filterLiveOnly && !s.live_lat) return false;
    if (filterBusType !== 'ALL' && (s.bus_type || '').toUpperCase() !== filterBusType) return false;
    if (filterDate && s.departure_date !== filterDate) return false;
    return true;
  });

  const tableActions = (
    <>
      <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plus size={14} /> Create Schedule
      </button>
      <button className="btn btn-secondary" onClick={() => exportToPDF('Trip_Schedules', pdfColumns, filteredSchedules)}>
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
    if (!route) return [];
    
    let stopsList = [];
    if (route.origin) stopsList.push(route.origin);
    
    if (route.stops) {
      try {
        const parsedStops = Array.isArray(route.stops) ? route.stops : JSON.parse(route.stops);
        stopsList = [...stopsList, ...parsedStops];
      } catch (e) {
        console.error('Error parsing route stops:', e);
      }
    }
    
    if (route.destination) stopsList.push(route.destination);
    
    // De-duplicate in case origin/destination are also in the stops array
    return [...new Set(stopsList)];
  }, [modal?.data?.route_id, routes]);

  return (
    <div className="page-schedules">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* ── Automation Engine Card ── */}
      <div className="automation-card ov-card" style={{ marginBottom: 20, padding: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--primary)" /> Automate Weekly Schedule
        </h3>
        <form onSubmit={handleAutomateSchedule} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg" style={{ flex: '1 1 200px' }}>
            <label>Select Route</label>
            <select value={automateForm.route_id} onChange={e => setAutomateForm(m => ({ ...m, route_id: e.target.value }))} required>
              <option value="">-- Choose Route --</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.route_number} ({r.origin} - {r.destination})</option>
              ))}
            </select>
          </div>
          <div className="fg" style={{ flex: '1 1 130px' }}>
            <label>Start Date</label>
            <input type="date" value={automateForm.start_date} onChange={e => setAutomateForm(m => ({ ...m, start_date: e.target.value }))} required />
          </div>
          <div className="fg" style={{ flex: '1 1 130px' }}>
            <label>End Date</label>
            <input type="date" value={automateForm.end_date} onChange={e => setAutomateForm(m => ({ ...m, end_date: e.target.value }))} required />
          </div>
          <div className="fg" style={{ flex: '1 1 110px' }}>
            <label>Start Time</label>
            <input type="time" value={automateForm.start_time} onChange={e => setAutomateForm(m => ({ ...m, start_time: e.target.value }))} required />
          </div>
          <div className="fg" style={{ flex: '1 1 110px' }}>
            <label>End Time</label>
            <input type="time" value={automateForm.end_time} onChange={e => setAutomateForm(m => ({ ...m, end_time: e.target.value }))} required />
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ height: 39, padding: '0 24px' }} disabled={submitting}>
              {submitting ? 'Generating...' : 'Automate'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ height: 39, padding: '0 24px', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={handleClearSchedules} disabled={submitting}>
              Clear Automated
            </button>
          </div>
        </form>
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar ov-card">
        <div className="filter-label"><Filter size={15} /> Filters</div>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Route</label>
            <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)}>
              <option value="ALL">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.route_number} – {r.route_name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="LIVE">LIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Bus Type</label>
            <select value={filterBusType} onChange={e => setFilterBusType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="NORMAL">NORMAL</option>
              <option value="INTERCITY">INTERCITY</option>
              <option value="CTB">CTB</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Date</label>
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="filter-date-input"
            />
          </div>
          <div className="filter-group">
            <label className="filter-check">
              <input
                type="checkbox"
                checked={filterLiveOnly}
                onChange={e => setFilterLiveOnly(e.target.checked)}
              />
              <span>Live Only</span>
            </label>
          </div>
          {(filterRoute !== 'ALL' || filterStatus !== 'ALL' || filterBusType !== 'ALL' || filterDate || filterLiveOnly) && (
            <button className="filter-clear" onClick={() => { setFilterRoute('ALL'); setFilterStatus('ALL'); setFilterBusType('ALL'); setFilterDate(''); setFilterLiveOnly(false); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading trip schedules...</div>
      ) : (
        <DataTable
          title="Trip Schedules"
          columns={columns}
          data={filteredSchedules}
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

      <style jsx>{`
        .s-pill { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .s-pill.scheduled { background: #E0F2FE; color: #0369A1; }
        .s-pill.live { background: #DCFCE7; color: #166534; animation: blink 2s infinite; }
        .s-pill.completed { background: #F1F5F9; color: #64748B; }
        .s-pill.cancelled { background: #FEF2F2; color: #B91C1C; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .s-live { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
        .s-dot { width: 6px; height: 6px; border-radius: 50%; background: #94A3B8; flex-shrink: 0; }
        .s-dot.on { background: #22C55E; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }

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
        .filter-group select, .filter-date-input {
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
        .filter-group select:focus, .filter-date-input:focus {
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

        @media (max-width: 768px) {
          .filter-bar { padding: 12px 16px; }
          .filter-controls { flex-direction: column; align-items: flex-start; }
          .filter-check { margin-top: 0; }
          .filter-clear { margin-top: 0; }
        }

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
